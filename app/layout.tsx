import "./globals.css";
import React from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  title: "Fata Dollgana | 馆",
  description: "A warm public archive for pixel relics of beloved dolls.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
