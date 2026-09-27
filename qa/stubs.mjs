// Local stand ins for Upstash Redis REST and Solana RPC. Test only.
import http from "node:http";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const kv = new Map(); // key -> {v, exp}
const lists = new Map();
const hashes = new Map();
const now = () => Date.now();
const get = (k) => { const e = kv.get(k); if (!e) return null; if (e.exp && e.exp < now()) { kv.delete(k); return null; } return e.v; };

function cmd(c) {
  const [op, ...a] = c.map((x) => (typeof x === "number" ? String(x) : x));
  switch (op.toUpperCase()) {
    case "SET": {
      const [k, v, ...opts] = a; let exp = 0, nx = false;
      for (let i = 0; i < opts.length; i++) { const o = opts[i].toUpperCase(); if (o === "EX") exp = now() + Number(opts[++i]) * 1000; if (o === "NX") nx = true; }
      if (nx && get(k) !== null) return null;
      kv.set(k, { v, exp }); return "OK";
    }
    case "GET": return get(a[0]);
    case "GETDEL": { const v = get(a[0]); kv.delete(a[0]); return v; }
    case "MGET": return a.map(get);
    case "DEL": { let n = 0; for (const k of a) { if (kv.delete(k)) n++; if (lists.delete(k)) n++; } return n; }
    case "INCR": { const v = Number(get(a[0]) ?? 0) + 1; const e = kv.get(a[0]); kv.set(a[0], { v: String(v), exp: e?.exp ?? 0 }); return v; }
    case "LPUSH": { const l = lists.get(a[0]) ?? []; for (const v of a.slice(1)) l.unshift(v); lists.set(a[0], l); return l.length; }
    case "LTRIM": { const l = lists.get(a[0]) ?? []; lists.set(a[0], l.slice(Number(a[1]), Number(a[2]) + 1)); return "OK"; }
    case "LRANGE": { const l = lists.get(a[0]) ?? []; const e = Number(a[2]); return l.slice(Number(a[1]), e < 0 ? undefined : e + 1); }
    case "LREM": { const l = lists.get(a[0]) ?? []; const f = l.filter((x) => x !== a[2]); lists.set(a[0], f); return l.length - f.length; }
    case "HSET": { const h = hashes.get(a[0]) ?? {}; for (let i = 1; i < a.length; i += 2) h[a[i]] = a[i + 1]; hashes.set(a[0], h); return 1; }
    case "HSETNX": { const h = hashes.get(a[0]) ?? {}; if (a[1] in h) return 0; h[a[1]] = a[2]; hashes.set(a[0], h); return 1; }
    case "PING": return "PONG";
    default: throw new Error("unsupported " + op);
  }
}

const body = (req) => new Promise((r) => { let s = ""; req.on("data", (d) => (s += d)); req.on("end", () => r(s ? JSON.parse(s) : {})); });

http.createServer(async (req, res) => {
  const b = await body(req);
  res.setHeader("content-type", "application/json");
  try {
    if (req.url.endsWith("/pipeline")) return res.end(JSON.stringify(b.map((c) => { try { return { result: cmd(c) }; } catch (e) { return { error: String(e) }; } })));
    res.end(JSON.stringify({ result: cmd(b) }));
  } catch (e) { res.end(JSON.stringify({ error: String(e) })); }
}).listen(8079);

// ---- Solana RPC ----
const pays = []; // {ref,to,amount(raw string),payer,blockTime,sig}
const balances = new Map(); // owner -> raw micro string
let rpcCalls = { getTokenAccountsByOwner: 0 };
let failBalance = false;

http.createServer(async (req, res) => {
  const b = await body(req);
  res.setHeader("content-type", "application/json");
  if (req.url === "/__pay") { const A = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let sig = ""; for (let i = 0; i < 88; i++) sig += A[Math.floor(Math.random() * 58)]; pays.push({ ...b, sig }); return res.end(JSON.stringify({ ok: true, sig })); }
  if (req.url === "/__balance") { balances.set(b.owner, String(b.raw)); return res.end("{}"); }
  if (req.url === "/__fail") { failBalance = !!b.on; return res.end("{}"); }
  if (req.url === "/__calls") return res.end(JSON.stringify(rpcCalls));
  const { method, params, id } = b;
  const out = (result) => res.end(JSON.stringify({ jsonrpc: "2.0", id, result }));
  if (method === "getSignaturesForAddress") return out(pays.filter((p) => p.ref === params[0]).map((p) => ({ signature: p.sig, err: null, blockTime: p.blockTime })));
  if (method === "getTransaction") {
    const p = pays.find((x) => x.sig === params[0]); if (!p) return out(null);
    return out({ blockTime: p.blockTime, meta: { err: null, preTokenBalances: [{ mint: USDC, owner: p.to, uiTokenAmount: { amount: "0" } }], postTokenBalances: [{ mint: USDC, owner: p.to, uiTokenAmount: { amount: String(p.raw) } }] }, transaction: { message: { accountKeys: [{ pubkey: p.payer, signer: true }] } } });
  }
  if (method === "getTokenAccountsByOwner") {
    rpcCalls.getTokenAccountsByOwner++;
    if (failBalance) return res.end(JSON.stringify({ jsonrpc: "2.0", id, error: { message: "down" } }));
    const raw = balances.get(params[0]) ?? "0";
    return out({ context: { slot: 1 }, value: raw === "0" && !balances.has(params[0]) ? [] : [{ pubkey: "Acct1111", account: { data: { parsed: { info: { mint: USDC, owner: params[0], tokenAmount: { amount: raw, decimals: 6, uiAmountString: String(Number(raw) / 1e6) } } } } } }] });
  }
  if (method === "getHealth" || method === "getSlot") return out(method === "getSlot" ? 1 : "ok");
  out(null);
}).listen(8899);
console.log("stubs up");
