"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { summaryApi } from "@/lib/api"

interface TopicSummaryProps {
  topicId: string
  topicName: string
}

export function TopicSummary({ topicId, topicName }: TopicSummaryProps) {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await summaryApi.getTopicSummary(topicId)
      setSummary(response.summary)
    } catch (err: any) {
      setError(err.message || "Failed to fetch summary")
      console.error("Error fetching summary:", err)
    } finally {
      setLoading(false)
    }
  }

  const generateNewSummary = async () => {
    try {
      setUpdating(true)
      setError(null)
      const response = await summaryApi.generateTopicSummary(topicId)
      setSummary(response.summary)
    } catch (err: any) {
      setError(err.message || "Failed to generate new summary")
      console.error("Error generating summary:", err)
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [topicId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Topic Summary</CardTitle>
          <CardDescription>AI-generated summary of recent news about {topicName}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Topic Summary</CardTitle>
          <CardDescription>AI-generated summary of recent news about {topicName}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-end">
            <Button onClick={fetchSummary} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Topic Summary</CardTitle>
          <CardDescription>AI-generated summary of recent news about {topicName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">No summary available for this topic yet.</p>
            <Button onClick={generateNewSummary} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Summary...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate Summary
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Topic Summary</CardTitle>
          <CardDescription>Last updated: {formatDate(summary.updatedAt || new Date().toISOString())}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={generateNewSummary} disabled={updating} className="ml-auto">
          {updating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Update
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Overview</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{summary.summary}</p>
        </div>

        {summary.keyInsights && summary.keyInsights.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Key Insights</h3>
            <ul className="list-disc pl-5 space-y-1">
              {summary.keyInsights.map((insight: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.trendingThemes && summary.trendingThemes.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Trending Themes</h3>
            <div className="space-y-3">
              {summary.trendingThemes.map((theme: any, index: number) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{theme.theme}</span>
                    <span className="text-sm text-muted-foreground">Relevance: {theme.relevance}/10</span>
                  </div>
                  <Progress value={(theme.relevance / 10) * 100} />
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.sentimentOverview && (
          <div>
            <h3 className="text-lg font-medium mb-2">Sentiment Overview</h3>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="flex flex-col items-center">
                <Badge variant="default" className="mb-1">
                  {summary.sentimentOverview.positive}%
                </Badge>
                <span className="text-xs text-muted-foreground">Positive</span>
              </div>
              <div className="flex flex-col items-center">
                <Badge variant="secondary" className="mb-1">
                  {summary.sentimentOverview.neutral}%
                </Badge>
                <span className="text-xs text-muted-foreground">Neutral</span>
              </div>
              <div className="flex flex-col items-center">
                <Badge variant="destructive" className="mb-1">
                  {summary.sentimentOverview.negative}%
                </Badge>
                <span className="text-xs text-muted-foreground">Negative</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic">"{summary.sentimentOverview.overall}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
