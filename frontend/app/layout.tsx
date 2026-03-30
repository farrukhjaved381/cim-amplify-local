import type React from "react"
import Script from "next/script"
import "@/app/globals.css"
// import { Inter } from "next/font/google"
// import { Poppins } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { DevToolsNotice } from "@/components/dev-tools-notice"
import { QueryProvider } from "@/lib/query-client"
import { NavigationProgress } from "@/components/navigation-progress"
import ErrorBoundary from "@/components/error-boundary"
import { Toaster } from "@/components/ui/toaster"

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || ""

// const inter = Inter({ subsets: ["latin"] })

// const poppins = Poppins({
//   subsets: ["latin"],
//   weight: ["400", "500", "600", "700"],
//   variable: "--font-poppins",
// })

export const metadata = {
  title: "CIM Amplify",
  description: "Deal marketplace platform for CIM Amplify",
  generator: "mubeen",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans`} suppressHydrationWarning>
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
            <NavigationProgress />
            <ErrorBoundary>
              <AuthProvider>{children}</AuthProvider>
            </ErrorBoundary>
            <DevToolsNotice />
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
