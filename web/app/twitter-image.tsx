import { ImageResponse } from "next/og";

export const alt = "QOVA · Dollars for everyone, one link away";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(180deg, #CFEFFF 0%, #E9FBF4 38%, #FFFFFF 70%)", color: "#070B14", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, border: "12px solid #9AA4AF", display: "flex" }} />
          <div style={{ fontSize: 40, letterSpacing: 6 }}>QOVA</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 300, lineHeight: 1.02 }}>Dollars for everyone.</div>
          <div style={{ fontSize: 96, fontWeight: 300, lineHeight: 1.02, color: "#0E9F7E" }}>One link away.</div>
        </div>
        <div style={{ fontSize: 26, color: "#5B6472", letterSpacing: 2 }}>USDC ON SOLANA · WALLET TO WALLET · $QOVA IS A MEME</div>
      </div>
    ),
    size
  );
}
