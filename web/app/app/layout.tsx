import type { Metadata } from "next";
import "./app.css";
export const metadata: Metadata = { title: "QOVA · Sign in", robots: { index: false } };
export default function AppLayout({ children }: { children: React.ReactNode }) { return children; }
