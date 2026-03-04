import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientErrorObserver } from "@/components/client-error-observer";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { WhatsAppChat } from "@/components/whatsapp-chat";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"]
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "StreetLuxCity Marketplace",
  description: "Your trusted clothing store"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} min-h-screen antialiased`}>
        <Providers>
          <ClientErrorObserver />
          <div className="flex min-h-screen flex-col">
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>
            <main className="mx-auto w-full max-w-[1500px] flex-1 px-3 py-6 sm:px-5 lg:px-8">
              {children}
            </main>
            <Footer />
            <WhatsAppChat />
          </div>
        </Providers>
      </body>
    </html>
  );
}