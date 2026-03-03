"use client"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)

  // Ensure theme provider only renders after hydration to prevent mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR and initial hydration, render children without theme provider wrapper
  // This prevents hydration mismatches from next-themes
  if (!mounted) {
    return <>{children}</>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
