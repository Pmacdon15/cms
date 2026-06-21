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
      <body className="flex min-h-full select-none flex-col bg-background font-sans text-foreground antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col bg-background">
            <Suspense
              fallback={
                <div className="h-15 border-zinc-200 border-b bg-white" />
              }
            >
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
