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
