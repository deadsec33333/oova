import "server-only";
import { createPublicKey, verify } from "node:crypto";
import bs58 from "bs58";

/**
 * The plain text a wallet signs to sign in. Sign In With Solana style.
 * It is a message, never a transaction, so it cannot move funds.
 */
export function signInMessage(host: string, wallet: string, nonce: string, issued: Date): string {
  const exp = new Date(issued.getTime() + 5 * 60 * 1000);
  return [
    `${host} wants you to sign in with your Solana account:`,
    wallet,
    "",
    "Sign in to QOVA. This is a free message. It is not a transaction and it cannot move funds.",
    "",
    `URI: https://${host}`,
    "Version: 1",
    "Chain ID: mainnet",
    `Nonce: ${nonce}`,
    `Issued At: ${issued.toISOString()}`,
    `Expiration Time: ${exp.toISOString()}`,
  ].join("\n");
}

/** Ed25519 check that `wallet` signed exactly `message`. */
export function verifySignature(wallet: string, message: string, signatureB58: string): boolean {
  try {
    const pub = bs58.decode(wallet);
    const sig = bs58.decode(signatureB58);
    if (pub.length !== 32 || sig.length !== 64) return false;
    const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: Buffer.from(pub).toString("base64url") }, format: "jwk" });
    return verify(null, Buffer.from(message, "utf8"), key, Buffer.from(sig));
  } catch {
    return false;
  }
}
