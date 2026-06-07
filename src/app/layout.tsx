import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Suspense } from "react";
import { Providers } from "../components/Providers";
import { Toaster } from "../components/ui/toast";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/ui/footer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CMS Pro - Client & Campaign Portal",
  description:
    "Next-gen premium marketing CMS with Neon Serverless, Clerk Auth, and AWS Pinpoint.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans antialiased select-none">
        <Providers>
          <div className="flex flex-col min-h-screen bg-background">
            <Suspense fallback={<div className="h-15 border-b border-zinc-200 bg-white" />}>
              <Navbar />
            </Suspense>
            {children}
            <Footer />
          </div>
          
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
