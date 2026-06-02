import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Split",
  description: "Track your global revenue and profit sharing.",
};

import { ChatWidget } from "@/components/ai/chat-widget";
import { auth } from "@/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={cn("h-full antialiased dark", hankenGrotesk.variable, jetbrainsMono.variable)}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-primary/30">
        {children}
        {session && <ChatWidget />}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
