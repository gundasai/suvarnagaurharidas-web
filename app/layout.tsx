import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/smooth-scroll";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";


const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });

export const metadata: Metadata = {
  title: "Suvarna Gaura Hari Das | Modern Spiritual Minimalism",

  description: "Bridging Technology & Ancient Wisdom.",
  icons: {
    icon: "/monk-profile.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable,
        cinzel.variable
      )}>
        <SmoothScroll>
          {children}
          <Toaster position="top-center" richColors />
        </SmoothScroll>

      </body>
    </html>
  );
}
