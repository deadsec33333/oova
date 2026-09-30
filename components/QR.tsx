"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QR({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let alive = true;
    QRCode.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#070B14", light: "#FFFFFF" } })
      .then((s) => { if (alive) setSvg(s); })
      .catch(() => setSvg(""));
    return () => { alive = false; };
  }, [value]);
  return <div className="qr" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />;
}
