import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Providers } from "../components/Providers";
import { Toaster } from "../components/ui/toast";
import "./globals.css";

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
  title: "ApexCMS - Client & Campaign Portal",
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
      <body className="min-h-full flex flex-col bg-black font-sans text-zinc-100 antialiased select-none">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
