"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api"

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token")
        if (token) {
          // Verify token format
          if (!token.trim()) {
            console.error("Token is empty or whitespace")
            localStorage.removeItem("token")
            return
          }

          // Set token in cookie as well
          document.cookie = `token=${token}; path=/; max-age=604800` // 7 days

          // Log token for debugging (remove in production)

          const { user } = await authApi.getCurrentUser()
          setUser(user)
        }
      } catch (err) {
        // Token might be invalid or expired
        console.error("Auth check failed:", err)
        localStorage.removeItem("token")
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await authApi.login({ email, password })

      // Ensure token is properly stored
      if (data.token) {
        localStorage.setItem("token", data.token)
        // Also set as cookie
        document.cookie = `token=${data.token}; path=/; max-age=604800` // 7 days

        // Log token for debugging (remove in production)
      } else {
        console.error("No token received from login")
      }

      setUser(data.user)
      // Make sure we redirect only after everything is set
      setTimeout(() => router.push("/"), 100)
    } catch (err: any) {
      setError(err.message || "Failed to login")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await authApi.register({ name, email, password })

      // Ensure token is properly stored
      if (data.token) {
        localStorage.setItem("token", data.token)
        // Also set as cookie
        document.cookie = `token=${data.token}; path=/; max-age=604800` // 7 days
      }

      setUser(data.user)
      // Make sure we redirect only after everything is set
      setTimeout(() => router.push("/"), 100)
    } catch (err: any) {
      setError(err.message || "Failed to register")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    setUser(null)
    router.push("/login")
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
