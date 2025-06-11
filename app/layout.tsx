import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Map Area Marker - Penanda Area Interaktif",
  description:
    "Aplikasi web untuk menandai dan mengukur area di peta dengan fitur marker, polygon, koneksi antar area, dan berbagai layer peta. Cocok untuk survei lahan, perencanaan wilayah, dan analisis geografis.",
  keywords:
    "peta, marker, polygon, area, survei lahan, GIS, OpenStreetMap, Leaflet, pengukuran area, analisis geografis",
  authors: [{ name: "Map Area Marker Team" }],
  creator: "Map Area Marker",
  publisher: "Map Area Marker",
  robots: "index, follow",
  openGraph: {
    title: "Map Area Marker - Penanda Area Interaktif",
    description:
      "Aplikasi web untuk menandai dan mengukur area di peta dengan fitur lengkap untuk survei lahan dan analisis geografis.",
    type: "website",
    locale: "id_ID",
    siteName: "Map Area Marker",
  },
  twitter: {
    card: "summary_large_image",
    title: "Map Area Marker - Penanda Area Interaktif",
    description:
      "Aplikasi web untuk menandai dan mengukur area di peta dengan fitur lengkap untuk survei lahan dan analisis geografis.",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#3b82f6",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="application-name" content="Map Area Marker" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Map Area Marker" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
