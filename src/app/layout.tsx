import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Auction Demo",
  description: "Live bidding on one property",
};

export const viewport: Viewport = {
  themeColor: "#101828",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen bg-paper text-ink">{children}</body>
    </html>
  );
}
