"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, ThumbsUp, ThumbsDown, Minus, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { newsApi } from "@/lib/api"

interface ArticleListProps {
  topicId: string
}

interface Article {
  id: string
  title: string
  description: string
  url: string
  source: {
    name: string
    url: string
  }
  publishedAt: string
  content: string
  sentiment: {
    score: number
    magnitude: number
    label: string
  }
}

export function ArticleList({ topicId }: ArticleListProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true)
        const response = await newsApi.getNewsForTopic(topicId)
        setArticles(response.news)
      } catch (err: any) {
        setError(err.message || "Failed to fetch articles")
        console.error("Error fetching articles:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [topicId])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return
    }

    try {
      setIsSearching(true)
      const response = await newsApi.searchNews(topicId, searchQuery)
      setArticles(response.results)
    } catch (err: any) {
      setError(err.message || "Failed to search articles")
      console.error("Error searching articles:", err)
    } finally {
      setIsSearching(false)
    }
  }

  const resetSearch = async () => {
    setSearchQuery("")
    try {
      setLoading(true)
      const response = await newsApi.getNewsForTopic(topicId)
      setArticles(response.news)
    } catch (err: any) {
      setError(err.message || "Failed to fetch articles")
      console.error("Error fetching articles:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <ThumbsUp className="h-4 w-4" />
      case "negative":
        return <ThumbsDown className="h-4 w-4" />
      case "neutral":
        return <Minus className="h-4 w-4" />
      default:
        return null
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "success"
      case "negative":
        return "destructive"
      case "neutral":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search articles..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
        {searchQuery && (
          <Button variant="outline" onClick={resetSearch}>
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">{error}</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No articles found</h2>
          <p className="text-muted-foreground">
            {searchQuery ? "Try a different search query" : "No articles have been collected for this topic yet"}
          </p>
        </div>
      ) : (
        articles.map((article) => (
          <Card key={article.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div>
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <span>{article.source.name}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(article.publishedAt)}</span>
                  </CardDescription>
                </div>
                <Badge variant={getSentimentColor(article.sentiment.label) as any} className="flex items-center">
                  {getSentimentIcon(article.sentiment.label)}
                  <span className="ml-1 capitalize">{article.sentiment.label}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{article.description || article.content}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="ml-auto" asChild>
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Read Full Article
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  )
}
