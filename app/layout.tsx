import type { Metadata } from "next";
import { Bangers, Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const display = Bangers({
  variable: "--font-bangers",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ragebait",
  description:
    "A chat app that overdoes your request or does the wrong thing on purpose. Funny on purpose. No API key required.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
