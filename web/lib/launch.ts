import config from "../launch.config.json";
import { isSolanaAddress } from "./solanapay";

const ca = (config.token.ca || "").trim();
export const launch = {
  live: isSolanaAddress(ca),
  ca: isSolanaAddress(ca) ? ca : "",
  pair: (config.token.pair || "").trim(),
  links: config.links,
};
