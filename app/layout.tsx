import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veritas Microfinance Bank",
  description: "Secure digital banking for everyone",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}