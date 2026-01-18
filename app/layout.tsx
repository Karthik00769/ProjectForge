import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "@/components/ui/toaster" // Or sonner, likely toaster is in ui/toaster or ui/sonner. Based on file list it has components/ui/toaster.tsx but also sonner.tsx. Usually Toaster comes from toaster.tsx if using shadcn/ui toast, or sonner.tsx if using sonner. I'll guess toaster.tsx first or check file list again.
// Re-checking file list: create mode 100644 components/ui/toaster.tsx, create mode 100644 components/ui/sonner.tsx.
// Standard shadcn uses Toaster from the file named toaster.tsx usually, or sonner.
// I'll stick to standard toaster import first. if it fails i'll check.


const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ProjectForge - Verifiable Proof of Work Platform",
  description: "Trust-based work and task verification platform with evidence, audit logs, and tamper detection.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
