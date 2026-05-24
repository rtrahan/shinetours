import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://shinetours-next.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Shine Tours - Yale Art Gallery Tours",
    template: "%s | Shine Tours",
  },
  description: "Book a guided Yale University Art Gallery tour exploring art, history, archaeology, and the world of the Bible.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Shine Tours - Yale Art Gallery Tours",
    description: "Book a guided Yale University Art Gallery tour exploring art, history, archaeology, and the world of the Bible.",
    url: "/",
    siteName: "Shine Tours",
    images: [
      {
        url: "/20240917_yale.jpg",
        width: 1024,
        height: 512,
        alt: "Yale University Art Gallery exhibition corridor",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shine Tours - Yale Art Gallery Tours",
    description: "Book a guided Yale University Art Gallery tour exploring art, history, archaeology, and the world of the Bible.",
    images: ["/20240917_yale.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-stone-50`}>
        {children}
      </body>
    </html>
  );
}
