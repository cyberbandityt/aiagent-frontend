"use client"

import { useState, useEffect, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Plus, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { topicsApi } from "@/lib/api"

// Available news sources (dummy data)
const availableSources = [
  { id: "nyt", name: "New York Times", category: "International" },
  { id: "bbc", name: "BBC News", category: "International" },
  { id: "cnn", name: "CNN", category: "International" },
  { id: "reuters", name: "Reuters", category: "International" },
  { id: "ap", name: "Associated Press", category: "International" },
  { id: "guardian", name: "The Guardian", category: "International" },
  { id: "wapo", name: "Washington Post", category: "International" },
  { id: "aljazeera", name: "Al Jazeera", category: "International" },
  { id: "nepaltimes", name: "Nepal Times", category: "Local" },
  { id: "kathmandupost", name: "Kathmandu Post", category: "Local" },
  { id: "himalayantimes", name: "Himalayan Times", category: "Local" },
  { id: "republica", name: "Republica", category: "Local" },
  { id: "onlinekhabar", name: "Online Khabar", category: "Local" },
  { id: "setopati", name: "Setopati", category: "Local" },
]

export default function NewTopicPage() {
  const router = useRouter()
  // Use useEffect to initialize state to avoid hydration mismatch
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [topicData, setTopicData] = useState({
    name: "",
    description: "",
    keywords: "",

  })

  // Selected news sources

  // Initialize client-side state after hydration
  useEffect(() => {
    setIsInitialized(true)
  }, [])

 

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate form
    if (!topicData.name.trim()) {
      setError("Please enter a topic name")
      setIsLoading(false)
      return
    }



    try {
      // Parse keywords from comma-separated string to array
      const keywords = topicData.keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0)

      // Create topic
      await topicsApi.createTopic({
        name: topicData.name,
        description: topicData.description,
        keywords,
      })

      // Redirect to dashboard on success
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Failed to create topic")
      console.error("Error creating topic:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // If not initialized yet, render a simple loading state to avoid hydration mismatch
  if (!isInitialized) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create New Topic</h1>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create New Topic</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Topic Details</CardTitle>
                <CardDescription>Enter the details of the topic you want to monitor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Topic Name*</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Climate Change, Elon Musk, Cryptocurrency"
                    value={topicData.name}
                    onChange={(e) => setTopicData({ ...topicData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the topic"
                    value={topicData.description}
                    onChange={(e) => setTopicData({ ...topicData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords (comma separated)</Label>
                  <Textarea
                    id="keywords"
                    placeholder="e.g., climate, global warming, environment"
                    value={topicData.keywords}
                    onChange={(e) => setTopicData({ ...topicData, keywords: e.target.value })}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Add related keywords to improve the accuracy of news collection
                  </p>
                </div>

  </CardContent>
  </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>Review your topic settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Topic Name</h3>
                  <p className="text-sm text-muted-foreground">{topicData.name || "Not specified"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Description</h3>
                  <p className="text-sm text-muted-foreground">{topicData.description || "Not specified"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium">Keywords</h3>
                  <p className="text-sm text-muted-foreground">{topicData.keywords || "Not specified"}</p>
                </div>

               

                
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Topic...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Topic
                    </>
                  )}
                </Button>
                <Button variant="outline" type="button" className="w-full" onClick={() => router.push("/")}>
                  Cancel
                </Button>
                <CardDescription>The news articles will be rescraped every hour automatically.</CardDescription>

              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
