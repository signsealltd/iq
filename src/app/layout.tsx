import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignSeal Pricing Assist",
  description: "Internal pricing, quotation and profitability tool for SignSeal Ltd"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
