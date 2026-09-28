import "server-only";
import { randomBytes } from "node:crypto";
import { pipeline, redis } from "@/lib/db";

export type PayMethod = "wallet" | "card";
export type CardOrderRef = { id: string; status: string; at: number };

export type LinkRec = {
  id: string; to: string; amount: string; label: string; message: string; ref: string;
  createdAt: number; status: "open" | "paid";
  /** Card, Apple Pay and Google Pay through the onramp provider. On unless the receiver turned it off. */
  card?: boolean;
  /** The latest card checkouts started on this link (ids of our own order records, never card data). */
  cardOrders?: CardOrderRef[];
  paid?: {
    signature: string; payer: string | null; blockTime: number | null; exact: boolean;
    method?: PayMethod; provider?: string; orderId?: string;
    /** Only set for sandbox test payments on devnet. */
    network?: "devnet";
  };
};

export const cardAccepted = (l: LinkRec) => l.card !== false;

export const MAX_LINKS = 200;
const listKey = (w: string) => `links:${w}`;
const linkKey = (id: string) => `link:${id}`;
const refKey = (ref: string) => `refid:${ref}`;

export const newLinkId = () => randomBytes(9).toString("base64url");

export async function listLinks(wallet: string, limit = 100): Promise<LinkRec[]> {
  const ids = await redis<string[]>("LRANGE", listKey(wallet), 0, limit - 1);
  if (!ids?.length) return [];
  const raws = await redis<(string | null)[]>("MGET", ...ids.map(linkKey));
  return raws.flatMap((r) => { try { return r ? [JSON.parse(r) as LinkRec] : []; } catch { return []; } }).filter((l) => l.to === wallet);
}

export async function getLink(wallet: string, id: string): Promise<LinkRec | null> {
  const raw = await redis<string | null>("GET", linkKey(id));
  if (!raw) return null;
  const l = JSON.parse(raw) as LinkRec;
  return l.to === wallet ? l : null;
}

/** Any link by id, for server side work that already knows which link it is (card orders). */
export async function getLinkById(id: string): Promise<LinkRec | null> {
  const raw = await redis<string | null>("GET", linkKey(id));
  try { return raw ? (JSON.parse(raw) as LinkRec) : null; } catch { return null; }
}

/** The saved link behind a pay page, found by its reference key. Links made before this index are found once and indexed. */
export async function getLinkByRef(ref: string): Promise<LinkRec | null> {
  const id = await redis<string | null>("GET", refKey(ref));
  if (id) { const l = await getLinkById(id); if (l && l.ref === ref) return l; }
  const wallet = await redis<string | null>("GET", `ref:${ref}`);
  if (!wallet) return null;
  const l = (await listLinks(wallet, MAX_LINKS)).find((x) => x.ref === ref) ?? null;
  if (l) await redis("SET", refKey(ref), l.id, "EX", 90 * 86400);
  return l;
}

export async function saveLink(l: LinkRec, isNew: boolean) {
  const cmds: (string | number)[][] = [["SET", linkKey(l.id), JSON.stringify(l)]];
  if (isNew) cmds.push(["LPUSH", listKey(l.to), l.id], ["LTRIM", listKey(l.to), 0, MAX_LINKS - 1], ["SET", refKey(l.ref), l.id, "EX", 90 * 86400]);
  await pipeline(cmds);
}

export async function deleteLink(wallet: string, id: string) {
  const l = await getLinkById(id);
  await pipeline([["LREM", listKey(wallet), 0, id], ["DEL", linkKey(id)], ...(l ? [["DEL", refKey(l.ref)]] : [])]);
}
