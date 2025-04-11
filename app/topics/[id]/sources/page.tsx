"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ExternalLink, Newspaper, Loader2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SourcesDistributionChart } from "@/components/sources-distribution-chart"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { newsApi, topicsApi } from "@/lib/api"

interface NewsItem {
  _id: string
  topic: string
  title: string
  description: string
  url: string
  publishedAt: string
  source: {
    name: string
    url: string | null
  }
  sentiment: {
    score: number
    magnitude: number
    label: string
  }
}

interface SourceStats {
  name: string
  articleCount: number
  lastArticle: string
  url: string | null
  articles: NewsItem[]
}

export default function TopicSourcesPage({ params }: { params: { id: string } }) {
  const [topic, setTopic] = useState<{ id: string; name: string; description?: string }>({ 
    id: params.id, 
    name: "" 
  })
  const [sources, setSources] = useState<SourceStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNewsData = async () => {
      try {
        setLoading(true)
        
        // Fetch topic details
        const topicResponse = await topicsApi.getTopicById(params.id)
        
        // Fetch news data
        const data = await newsApi.getNewsForTopic(params.id)
        
        if (!data.success) {
          throw new Error("API returned unsuccessful response")
        }
        
        // Set topic info
        setTopic({
          id: params.id,
          name: topicResponse.topic.name,
          description: topicResponse.topic.description || "News sources analysis"
        })
        
        // Process news data to group by source
        const sourceMap = new Map<string, SourceStats>()
        
        data.news.forEach((newsItem: NewsItem) => {
          const sourceName = newsItem.source.name
          
          if (!sourceMap.has(sourceName)) {
            sourceMap.set(sourceName, {
              name: sourceName,
              articleCount: 0,
              lastArticle: "",
              url: newsItem.source.url,
              articles: []
            })
          }
          
          const sourceStats = sourceMap.get(sourceName)!
          sourceStats.articleCount++
          sourceStats.articles.push(newsItem)
          
          // Update last article date if newer
          const publishedDate = new Date(newsItem.publishedAt)
          if (!sourceStats.lastArticle || new Date(sourceStats.lastArticle) < publishedDate) {
            sourceStats.lastArticle = newsItem.publishedAt
          }
        })
        
        // Convert Map to array and sort by article count (descending)
        const sourcesArray = Array.from(sourceMap.values())
          .sort((a, b) => b.articleCount - a.articleCount)
        
        // Format relative dates for lastArticle
        sourcesArray.forEach(source => {
          source.lastArticle = formatRelativeTime(new Date(source.lastArticle))
        })
        
        setSources(sourcesArray)
      } catch (err: any) {
        setError(err.message || "Failed to fetch news data")
        console.error("Error fetching news data:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchNewsData()
  }, [params.id])

  // Helper function to format relative time
  const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffInMilliseconds = now.getTime() - date.getTime()
    const diffInSeconds = Math.floor(diffInMilliseconds / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInDays > 7) {
      return new Date(date).toLocaleDateString()
    } else if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  // Calculate total articles
  const totalArticles = sources.reduce((sum, source) => sum + source.articleCount, 0)

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href={`/topics/${params.id}`}>
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Topic
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link href={`/topics/${params.id}`}>
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{topic.name}: News Sources</h1>
          <p className="text-muted-foreground">{topic.description}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sources">All Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sources Distribution</CardTitle>
                <CardDescription>Distribution of articles by news source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <SourcesDistributionChart topicId={params.id} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Sources</CardTitle>
                <CardDescription>News sources with the most articles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sources.slice(0, 5).map((source, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{source.name}</span>
                        <span className="text-sm text-muted-foreground">{source.articleCount} articles</span>
                      </div>
                      <Progress value={(source.articleCount / totalArticles) * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All News Sources</CardTitle>
              <CardDescription>All sources that have published articles about {topic.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sources.map((source, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="bg-muted p-4 flex items-center">
                      <Newspaper className="h-5 w-5 mr-2 text-muted-foreground" />
                      <h3 className="font-medium">{source.name}</h3>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <Badge>{source.articleCount} articles</Badge>
                        <span className="text-xs text-muted-foreground">Last article: {source.lastArticle}</span>
                      </div>
                      <div className="flex justify-between mt-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/topics/${params.id}/analytics?source=${encodeURIComponent(source.name)}`}>
                            View Articles
                          </Link>
                        </Button>
                        {source.url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={source.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Visit
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 flex justify-end">
        <Link href={`/topics/${params.id}/analytics`}>
          <Button>
            <ExternalLink className="mr-2 h-4 w-4" />
            View Complete Analytics
          </Button>
        </Link>
      </div>
    </div>
  )
}