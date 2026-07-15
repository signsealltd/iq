import type { Metadata, Viewport } from "next";
import { PwaRegistration } from "@/components/PwaRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignSeal IQ",
  applicationName: "SignSeal IQ",
  description: "Internal pricing and business management for SignSeal Ltd",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/iq-logo.svg", type: "image/svg+xml" },
      { url: "/icons/iq-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/iq-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/iq-180.png", sizes: "180x180", type: "image/png" }]
  },
  appleWebApp: {
    capable: true,
    title: "SignSeal IQ",
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0c",
  colorScheme: "dark"
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
      <body>
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}