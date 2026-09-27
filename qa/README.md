# QOVA QA harness (local only)

Stand ins so every flow can be tested without real money, keys or networks.

* `stubs.mjs`: Upstash Redis REST (port 8079) and Solana RPC (port 8899) stand ins. `POST /__pay` puts a USDC transfer on the fake chain.
* `moonpay-stub.mjs`: MoonPay API and a checkout page stand in (port 8898). Checks the URL signature, sends signed webhooks, delivers on the fake chain.
* `lib.mjs`: Playwright helpers and a fake Wallet Standard wallet that really signs (Ed25519).
* `e2e.mjs`: wallet flows (sign in, create, counter QR paid, reload, delete, balance, reduced motion).
* `card-e2e.mjs`, `card-backend.mjs`, `card-dashboard.mjs`, `card-shots.mjs`: card payments end to end.
* `local-env.sh`: fake values for the stand ins. Real keys only ever live in Vercel.

Run: `node stubs.mjs & node moonpay-stub.mjs &`, build the app with `local-env.sh` sourced, `next start -p 3000`, then `node e2e.mjs` and `node card-e2e.mjs`. Paths in `lib.mjs` assume the cloud workspace layout; adjust `createRequire` and the Chromium path for another machine. The session route allows 10 checkouts per payer IP per minute, so wait a minute between runs of `card-backend.mjs`.
