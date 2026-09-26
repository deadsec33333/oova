import "server-only";
import { randomBytes } from "node:crypto";
import { pipeline, redis } from "@/lib/db";

export type LinkRec = {
  id: string; to: string; amount: string; label: string; message: string; ref: string;
  createdAt: number; status: "open" | "paid";
  paid?: { signature: string; payer: string | null; blockTime: number | null; exact: boolean };
};

export const MAX_LINKS = 200;
const listKey = (w: string) => `links:${w}`;
const linkKey = (id: string) => `link:${id}`;

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

export async function saveLink(l: LinkRec, isNew: boolean) {
  const cmds: (string | number)[][] = [["SET", linkKey(l.id), JSON.stringify(l)]];
  if (isNew) cmds.push(["LPUSH", listKey(l.to), l.id], ["LTRIM", listKey(l.to), 0, MAX_LINKS - 1]);
  await pipeline(cmds);
}

export async function deleteLink(wallet: string, id: string) {
  await pipeline([["LREM", listKey(wallet), 0, id], ["DEL", linkKey(id)]]);
}
