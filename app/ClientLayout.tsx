"use client"

import type React from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Navbar } from "@/components/navbar"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  // Check if we're on the login page
  const isAuthPage = pathname === "/login"

  useEffect(() => {
    // If we're on the login page, don't show loading
    if (isAuthPage) {
      setIsLoading(false)
      return
    }

    // Check if we have a token
    const token = localStorage.getItem("token")

    // If we have a token, set it as a cookie
    if (token) {
      // Log token for debugging (remove in production)
      document.cookie = `token=${token}; path=/; max-age=604800` // 7 days
    }

    // Simulate a short delay to ensure everything is loaded
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [isAuthPage])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        {isLoading && !isAuthPage ? (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {!isAuthPage && <Navbar />}
            <main className="min-h-[calc(100vh-4rem)]">
              {children}
            </main>
          </>
        )}
      </AuthProvider>
    </ThemeProvider>
  )
}