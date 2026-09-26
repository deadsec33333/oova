# QOVA site

Next.js 16 app in `web/`, deployed on Vercel (project currently named `web`, team Plytaa's projects) from the private repo AuRiMeLiS101/qova. Every push to `main` deploys.

## World
A daylight fintech console. Mix of two references Aurimas picked: Stockcoin (chrome buttons, silver 3D coin, glass chips, halftone dots) and Bridge (white calm finance, huge thin grotesk, mono labels, money flow diagram). Inspired, not copied: own layout, coin, diagram and copy.

## Sections
1. Sticky glass nav: Q mark, section links, chrome "Make a link".
2. Hero: soft sky and mint gradient, thin display headline "Dollars for everyone. One link away.", chrome CTA, the chrome Q coin (tilts to the pointer, flips when a link is made) with two glass chips marked "sample".
3. Truth strip: pay links are free and use USDC, QOVA never holds money, $QOVA is a meme.
4. How it works: 3 node flow diagram with animated mint dots on dashed wires.
5. Dark band: the real tool, a Solana Pay USDC link maker over a rotating halftone dot globe. Output: link, QR (solana: URL), copy, open, share to WhatsApp, Telegram, X.
6. Who it is for: freelancers, families, small shops, creators.
7. Lore: the coin with no face.
8. $QOVA launch panel: contract NOT DEPLOYED YET (copy disabled), stats "live at launch", sample chart with PREVIEW stamp, anti scam line. Reads `web/launch.config.json`.
9. Community: X, Telegram, TikTok, Instagram marked "soon" until links exist.
10. FAQ and full disclaimer.

`/pay?to=&amount=&label=&message=&ref=`: pay page with amount, receiver, QR, "Pay with a Solana wallet" deep link, copy address and amount, warning. Invalid links show a clean "This link is broken" card.

## Engine (foundation)
- Solana Pay transfer request: `solana:<to>?amount=<n>&spl-token=EPjF…Dt1v&reference=<ref>&label=&message=`.
- Non custodial: no wallet connect, nothing signed on the site, nothing stored. The payer's wallet builds and signs the transfer.
- Validation: base58 32 byte address, amount up to 6 decimals, above 0, max 1,000,000, text trimmed and length capped.
- `reference` is a random 32 byte key so a later version can confirm payment by reference (read only RPC).

## Design DNA
| Axis | QOVA |
|---|---|
| World | daylight fintech console, a chrome coin routing dollars over a dot globe |
| Layout | fintech landing: thin display hero, truth strip, flow diagram, one dark tool band, list sections |
| Type | Geist 300 to 500 + Geist Mono labels |
| Colour | white and near black ink, chrome silver, one mint accent that means "arrived", soft sky gradient |
| Texture | blurred sky and mint gradient, glass chips, halftone dot globe, dashed wires |
| Motion | coin tilt, shine sweep and flip on link made, dots flowing along wires, slow globe spin |
| Toy | make a real USDC pay link and QR |
| Navigation | sticky glass top bar |
| Sound | none |

## QA (26 Sep 2026)
- 390 px and 1366 px: no horizontal overflow, all taps at least 44 px, long links and addresses wrap.
- Link maker: invalid address and amount show errors; valid input gives a pay page link and a Solana Pay URL that follows the spec.
- Pay page and broken link page checked.
- Reduced motion: all animation off.
- Not done yet: a real payment test with a phone wallet, Lighthouse run, OG image check on X.

## v2: motion and show off layer (26 Sep 2026)
- Lenis smooth scrolling synced with GSAP ScrollTrigger; SplitText word reveals that play in and reverse out; scrubbed lore text; parallax; nav hides on scroll down; mint progress bar.
- Entry ritual: the Q draws itself (1.25 s, once per session, tap to skip, CSS failsafe).
- Hero: masked line reveal, rotating word (everyone, freelancers, families, small shops, creators), 8 token and currency badges orbiting the coin in 3D, magnetic chrome buttons with a shine sweep, faint grid.
- Currency rail: NGN, PHP, BRL, KES, IDR, PEN, ARS, GHS, MXN to USDC (symbols only, no rates).
- Story: pinned scroll section, a phone plays a full payment in 4 steps (type, share, slide to pay, arrived with count up and sparks). Sample data, labelled.
- Bento: 6 cards with Lucide icons, pointer tilt and glow, live micro animations (rolling amount, QR scan line, wallet names, chat bubbles, lock wiggle, real stats: 0 accounts, 1 link, 24/7, under $0.01 typical fee).
- Dark band: draggable halftone globe with sample payment arcs between 20 cities, cursor spotlight, then the real link maker.
- Giant QOVA wordmark rises in the footer.
- Token and currency badges are original drawings, not official logos.
- QA: 390 px and 1366 px, no overflow, no console errors, story steps in sync with the phone, reduced motion turns everything off.

## v3: black and white edition (26 Sep 2026)
- Whole site is monochrome: white, near black ink, silver chrome. No colour accents. Token and currency badges redrawn in black and white.
- Nav: floating glass pill that narrows on scroll, rolling text links, scroll progress line inside the pill. Phones get a round menu button that opens a full screen black menu with big staggered links.
- Buttons: pill buttons with a rolling label on hover, an arrow chip that swaps arrows, a soft sheen, magnetic pull on desktop.
- Scroll motion calmed down: Lenis lerp 0.09, headings rise line by line out of a mask (no blur), blocks fade up once.
- Story rebuilt: realistic phone (status bar, island, side buttons, glare, 3D tilt across the scroll), keypad typing 2 5 . 0 0, share sheet, chat with typing dots and link preview, confirm payment with slide to pay and face scan, notification banner, drawn check ring, count up, sparks and receipt. Progress rail and icon steps on desktop, floating tags per step.

## v3.1: logo and floating panels (26 Sep 2026)
- New mark: a coin shaped like a chat bubble, cut by the tail of a Q (the payment request is a message). One path, works from 16 px to billboard. Files in `brand/`: black and white SVG marks, app icon, PFP 400 and 1024, X banner 1500x500, wordmark.
- Nav turns into dark glass when it sits over a dark section; the scroll line under the nav is gone.
- Dark sections and the footer are now rounded floating panels with side margins.
- Globe glow no longer clipped (the hard rectangle is gone), soft round mask, arcs stay inside.

## v4: black edition, 3D coin, glossy tokens, sound (26 Sep 2026)
- Theme button in the nav: white or black edition, circle reveal from the button (View Transitions), remembered per browser, no flash on load.
- Hero coin rebuilt as a real 3D chrome coin: embossed QOVA mark on both faces, milled edge from 14 stacked layers, slow sway, pointer tilt, flip when a link is made.
- Orbit tokens are glossy, larger, never faded or blurred, pop in on load and bob.
- Sound design, all synthesised with Web Audio (no files), off by default: hover ticks, taps, keypad clicks in the story, whoosh per story step, a cash ping when the payment arrives, a chime when a link is made, a swoosh on theme change, and a quiet breathing pad. The floating sound button is a live equalizer driven by the real audio output; one click turns everything off.
- Scrolling currency rail removed. USDC labels next to big numbers no longer squished.

## v5: island nav, trust, ticker coins, app design (26 Sep 2026)
- Nav is now a black dynamic island: logo with a scroll progress ring, the current section name and number (rolling in), theme button, Sign in, Make a link. It expands into all links at the top of the page or on hover; phones get the full screen menu.
- Orbit coins: SOL, USDC, BONK, WIF, POPCAT, DOGE, BTC, ETH, JUP as glossy monochrome ticker coins in HTML (not SVG text, fixes the black boxes some browsers drew). Not official logos.
- Sound: interaction sounds only, the background pad is gone.
- New "Safe by design" section: animated money flow (payer wallet, Solana, your wallet, with QOVA outside the path), four trust pillars, and an interactive breakdown of what a pay link contains.
- Footer with link columns, "Built on" (Solana, USDC by Circle, Solana Pay standard) and a risk disclosure anchor.
- /app: design preview of the signed in product. Sign in with a wallet (shows the exact free message to sign, never a transaction), Google or email. Dashboard with received this month, quick link, pay links table, live activity, connected accounts, sidebar on desktop and a tab bar on phones. All sample data, clearly marked; nothing connects yet.

## v6: the link bar nav (26 Sep 2026)
- The nav is a link: `qova/how-it-works`. It deletes and retypes itself, character by character with a block caret, as you scroll into each section; the path field fills softly with scroll progress.
- Click it, press ⌘K / Ctrl K or `/`: it becomes an input and a command bar drops down. Type to filter (ranked by slug, then name, then description), arrows to move, enter to go, esc to close. Marks "you are here". Same on phones.
- Dark glass automatically over dark sections and in the black edition. Typing clicks when sound is on.

## v7: official token art, calmer orbit, trust rebuilt (27 Sep 2026)
- SOL, DOGE and USDC use the official artwork Aurimas supplied (web/public/tokens), cropped into glossy coins with rim, shine and shadow. Other coins stay as brand colour ticker coins until their files are supplied.
- Orbit coins always float above the big coin, on a wider, calmer ellipse.
- Security section rebuilt as a dark cinematic panel right after the story: "We can't touch your money. Not won't. Can't." with scroll lit words, a Typical app vs QOVA switch (coins get stuck in "their account" vs fly straight to you, labelled illustration), four counters that count down to an honest 0, and "Don't trust us. Verify." with the link anatomy and links to the Solana Pay spec and USDC.
