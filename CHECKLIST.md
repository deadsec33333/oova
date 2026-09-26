# Build checklist: from idea to launch and after

Copy this list into `test-<ticker>/CHECKLIST.md` and tick it as you go. Stages 0 to 5 are the brand and the demo. Stages 6 to 9 are only for a coin that will really launch.

## Stage 0: Learn from the past (30 min)
* [ ] Read every `test-*/` folder and `docs/LESSONS.md`
* [ ] Read `design_log.json`, list the worlds, fonts, colours and toys already used
* [ ] Write 3 to 5 lines: what to reuse, what to avoid

## Stage 1: Theme and niche
* [ ] Pick at least 3 seed banks (micro subculture, profession with inside jokes, strange nature, object with personality, lesser known folklore, science, internet archaeology, a specific place)
* [ ] Collision method: creature or object + niche + material + twist
* [ ] Generate 20 concepts, score each 1 to 5 on Novelty, Instant read, Meme ability, Lore depth, Visual hook, Niche fit
* [ ] Kill anything under 4 on Novelty or Visual hook, keep the top 3
* [ ] Cliche filter: no dogs or cats in hats, Pepe clones, "baby X", "inu", rockets, lambos, real people, chart puns, copies of trending coins
* [ ] Never seen check: name and ticker not in `data/memecoin_dataset.csv`, web search for live tokens, search pump.fun and DexScreener by name
* [ ] Check the X handle, Telegram name, TikTok and Instagram handle and a domain are free

## Stage 2: Mascot
* [ ] Pick the axes: material, render medium, anatomy twist, signature behaviour, default emotion (not a generic smile)
* [ ] 16 exploration images, pick 1
* [ ] Character sheet + 8 expressions + a 5 s idle loop
* [ ] WOW test: clear silhouette, reads in one second, works at 64 px, a kid could draw it in 5 lines, stops the scroll
* [ ] Save every prompt in `BRAND.md` so the look stays consistent

## Stage 3: Lore and voice
* [ ] Origin story in 3 to 5 paragraphs, told in the niche's own format (logs, placards, radio codes)
* [ ] 5 to 10 canon facts, 3 open threads for the community
* [ ] Rituals and slang: greeting, holder name, words for pump and dip
* [ ] 12 week season with cliffhangers (about the character, never about price)
* [ ] Voice: 5 do, 5 don't, 10 example posts, banned hype words, catchphrase
* [ ] Meme kit: 10 templates, 12 PFP or sticker variants, 3 short video ideas, 3 merch ideas
* [ ] Save `BRAND.md` + `brand.json`

## Stage 4: Brand assets (see `docs/ASSETS.md`)
* [ ] PFP 400x400 (+ 4096 master)
* [ ] X banner 1500x500
* [ ] OG share image 1200x630
* [ ] Telegram photo 640, Discord icon 512 + banner
* [ ] 1 teaser video 16:9 + 1 vertical 9:16
* [ ] 3 launch posts ready (image + copy)

## Stage 5: Website
* [ ] World concept: the site IS the mascot's world
* [ ] Design DNA: change at least 4 of 8 axes vs every entry in `design_log.json`
* [ ] Entry ritual under 1.5 s, skippable
* [ ] Living mascot on the first mobile screen, toy within the first click
* [ ] Contract as an in world object, NOT DEPLOYED YET before launch
* [ ] Launch preview section (chart, contract, stats, secret channel)
* [ ] Community layer: numbered membership, collectible set with one rare item, live counters, wall, lore mystery vote
* [ ] Honest how to buy, anti scam line, disclaimer
* [ ] OG + Twitter card meta tags
* [ ] Links to X, Telegram, TikTok, Instagram (winners have more platforms)
* [ ] prefers reduced motion version
* [ ] QA at 390 px and 1366 px: nothing overflows (long CA!), buttons at least 44 px, popups never block taps
* [ ] Lighthouse: performance over 85, accessibility over 90
* [ ] Save the site, append DNA to `design_log.json`

## Stage 6: Backend (only for a real launch, see `docs/CRYPTO_BACKEND.md`)
* [ ] Next.js app on Vercel, one `launch.config.json` as the single source of truth
* [ ] `/api/stats` from DexScreener with a 60 s cache and an honest offline state
* [ ] Wallet sign in by signed message (no transaction), server verifies the signature
* [ ] Redis (Upstash) for members, counters and rate limits
* [ ] Secrets in Vercel env only: `SESSION_SECRET`, `KV_*`, `SOLANA_RPC`
* [ ] Security headers, origin checks, text filters (no links, no wallet addresses, no scam phrases)
* [ ] Private RPC key (for example Helius) set as `SOLANA_RPC`
* [ ] Full QA with a test wallet on devnet before mainnet

## Stage 7: Before launch day
* [ ] Fresh wallets: dev (launches the coin), community or prize wallet. Seed phrases on paper, offline
* [ ] Test every flow with a second phone and a friend
* [ ] Seal anything that must be provable later (vault, commit hashes) and post the fingerprint
* [ ] Launch posts scheduled, X account warmed up with lore posts (no CA yet)
* [ ] Read the current launchpad fee and graduation rules (they change)

## Stage 8: Launch day
* [ ] Create the coin on the launchpad, copy the CA exactly
* [ ] Paste CA + dev wallet into `launch.config.json`, deploy
* [ ] Check the site CA matches the launchpad character by character
* [ ] Post the CA on X, pin it, set `caPinnedOnX: true`, deploy
* [ ] When DexScreener shows the pool, add the pair address, deploy
* [ ] Post in Telegram, Discord, TikTok, Instagram
* [ ] Watch for impostor tokens with the same name and warn early

## Stage 9: After launch
* [ ] Weekly lore drop (season calendar)
* [ ] Recognise fan content (reposts, wall, winners list with public tx links)
* [ ] Only real numbers in every post
* [ ] Write `LESSONS.md`: great, weak, try next time
* [ ] Commit and push
