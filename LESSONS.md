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
