"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2, LogOut, User } from "lucide-react"
import { TopicCard } from "@/components/topic-card"
import { topicsApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Topic {
  _id: string
  name: string
  description: string
  isActive: boolean
  keywords: string[]
  createdAt: string
  updatedAt: string
}

interface TopicWithStats extends Topic {
  articleCount: number
  lastUpdated: string
  sentiment: { positive: number; neutral: number; negative: number }
}

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth()
  const [topics, setTopics] = useState<TopicWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleDeleteTopic = (deletedTopicId: string) => {
    setTopics((prevTopics) => prevTopics.filter((topic) => topic._id !== deletedTopicId))
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error("Error during logout:", err)
    }
  }

  useEffect(() => {
    const fetchTopics = async () => {
      if (authLoading) return

      try {
        setLoading(true)
        const response = await topicsApi.getAllTopics()

        const transformedTopics = response.topics.map((topic: Topic) => {
          return {
            ...topic,
            articleCount: Math.floor(Math.random() * 50) + 5, // Placeholder
            lastUpdated: new Date(topic.updatedAt).toLocaleString(),
            sentiment: {
              positive: Math.floor(Math.random() * 40) + 20,
              neutral: Math.floor(Math.random() * 40) + 20,
              negative: Math.floor(Math.random() * 40) + 10,
            },
          }
        })

        setTopics(transformedTopics)
      } catch (err: any) {
        setError(err.message || "Failed to fetch topics")
        console.error("Error fetching topics:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTopics()
  }, [authLoading])

  if (authLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }


  return (
    <div className="container mx-auto py-8">
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">{error}</div>
      ) : topics.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No topics found</h2>
          <p className="text-muted-foreground mb-6">Create your first topic to start monitoring news</p>
          <Link href="/topics/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Topic
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <TopicCard key={topic._id} topic={topic} onDelete={handleDeleteTopic} />
          ))}
        </div>
      )}
    </div>
  )
}