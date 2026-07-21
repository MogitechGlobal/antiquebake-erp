import type { Metadata, Viewport } from "next";
import "./globals.css";

// Viewport configuration for the theme color defined in your manifest
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "AntiqueBake ERP | Antique Oven Ltd",
  description: "Enterprise Bakery ERP, Manufacturing & Smart POS Platform",
  
  // Implement the favicons and manifest based on the provided assets
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest', // Assuming you save the JSON snippet as site.webmanifest in the public/ folder
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-bakery-cream text-bakery-chocolate min-h-screen">
        {children}
      </body>
    </html>
  );
}