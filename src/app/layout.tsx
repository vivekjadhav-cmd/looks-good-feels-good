import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import ToastProvider from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Looks Good, Feels Good",
  description:
    "Your AI-powered personal stylist. Upload your wardrobe, tell us your mood, and get the perfect outfit — instantly.",
  keywords: ["outfit", "styling", "wardrobe", "AI", "fashion", "Singapore"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LGFG",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FAEEDA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="font-body antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
