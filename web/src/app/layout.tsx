// web/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AntiqueBake ERP | Antique Oven Ltd",
  description: "Enterprise Bakery ERP, Manufacturing & Smart POS Platform",
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