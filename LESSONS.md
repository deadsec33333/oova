# Lessons: $QOVA (foundation, 26 Sep 2026)

## Great
1. A real tool as the engine: the pay link works today, with or without the coin. The honesty line "$QOVA is a meme, not a dollar" sits right under the hero.
2. Picking two reference sites (Stockcoin + Bridge) gave a clear design direction fast. Clean fintech beats a themed world for a payments idea.
3. Git and Vercel set up first, so every later change is one push.

## Weak
1. The name took many rounds. Almost every short pretty word is taken as a token somewhere. Next time: generate 30 names, check all at once, show only the clean ones.
2. The Vercel connector can read but not create or rename projects. The project got auto named `web` from the root folder. Rename it in Vercel settings.
3. The connected folder blocks deletes by default, which breaks git and Next builds until delete access is approved.

## Try next time
1. Build and screenshot in a local copy, commit only the source.
2. Name the Vercel project before import, or keep the app at the repo root.
3. Test one real payment on a phone before sharing the link widely.


# Lessons: dashboard v2 (27 Sep 2026)

## Great
1. A reusable QA harness (fake Wallet Standard wallet that signs with a real Ed25519 key, tiny Upstash and Solana RPC stand ins with a "pay this reference" control) made every flow testable in the cloud, including the Paid moment.
2. Real data only still looks rich: timelines, receipts and the received line all come from createdAt and the paid blockTime.
3. One colour with one meaning (mint means arrived) reads premium and keeps the monochrome brand.

## Weak
1. Class name collision: the sign in page already used `.ax-card` as a grid with max width, which broke the dashboard layout on phones. Check globals for a class before reusing a short name.
2. Moving CSS out of globals nearly dropped `.ax-fine`, which the connect sheet uses. Diff the shared selectors before and after any CSS move.

## Try next time
1. Keep the harness in the repo (outside web/) so the next session does not rebuild it.
2. Test counter mode on a real phone: Wake Lock, vibration and the ping need real hardware.


# Lessons: card payments via MoonPay (27 Sep 2026)

## Great
1. Research before code found the real blocker early: most onramps' user terms say the payer must own the destination wallet. Get written approval for paying a recipient.
2. Our own on chain check is the source of truth. Webhooks and provider status only tell us where to look.
3. Building one step per commit (model, routes, detection, pay page, dashboard, tests) kept every step testable.

## Weak
1. A webhook can mark a link paid on the server, so the dashboard watcher that only checked open links never alerted. Alerts must also come from paid state changes, not only from our own polling.
2. Rate limits bite test scripts that run twice in a minute. Space test runs or use different test IPs.

## Try next time
1. Ask MoonPay for a Solana devnet USDC sandbox so the real checkout can be tested end to end.
2. Put the region and limits answers behind a small cache from day one (done here: 10 min and 1 h).


# Lessons: Coinflow (27 Sep 2026)
## Great
1. Reading the provider's OpenAPI file answered what the guides left vague (webhook events, totals fields, cart item types).
2. A provider registry with one interface let Coinflow slot in next to MoonPay without touching the pay page logic or the Paid rule.
## Weak
1. Coinflow only finds a payment by its own id, so we must capture it from the first webhook or the return redirect.
## Try next time
1. Ask the provider for the exact callback parameters and webhook samples before building.
