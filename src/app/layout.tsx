import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignSeal IQ",
  description: "Internal pricing and business management for SignSeal Ltd"
};

const themeScript = `
(function () {
  try {
    var preference = localStorage.getItem('signseal-iq-appearance') || 'dark';
    var resolved = preference === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  } catch (_) {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.style.colorScheme = 'dark';
  }
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}