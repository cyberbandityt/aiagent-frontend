"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "@/components/ui/chart"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { newsApi } from "@/lib/api"

interface SentimentBySourceChartProps {
  topicId: string
  timeframe?: string
}

export function SentimentBySourceChart({ topicId, timeframe = "7d" }: SentimentBySourceChartProps) {
  const [sourceData, setSourceData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSourceData = async () => {
      try {
        setLoading(true)
        // Fetch news with source information
        const response = await newsApi.getNewsForTopic(topicId, {
          limit: 100, // Get a good sample size
        })

        // Process the data to get sentiment by source
        const sourceMap = new Map()

        // Process each article
        response.news.forEach((article: any) => {
          const sourceName = article.source.name
          const sentiment = article.sentiment.label

          if (!sourceMap.has(sourceName)) {
            sourceMap.set(sourceName, {
              name: sourceName,
              positive: 0,
              neutral: 0,
              negative: 0,
              total: 0,
            })
          }

          const sourceStats = sourceMap.get(sourceName)
          sourceStats[sentiment]++
          sourceStats.total++
        })

        // Convert to array and sort by total articles
        const sourcesArray = Array.from(sourceMap.values())
          .sort((a, b) => b.total - a.total)
          .slice(0, 5) // Get top 5 sources

        setSourceData(sourcesArray)
      } catch (err: any) {
        setError(err.message || "Failed to fetch source data")
        console.error("Error fetching source data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSourceData()
  }, [topicId, timeframe])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (sourceData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <p className="text-muted-foreground">No source sentiment data available</p>
      </div>
    )
  }

  // Helper function to capitalize sentiment names
  const capitalizeSentiment = (sentiment: string): string => {
    return sentiment.charAt(0).toUpperCase() + sentiment.slice(1)
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={sourceData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          formatter={(value, name, props) => {
            // Make sure we're only dealing with sentiment names (strings)
            if (typeof name === "string" && (name === "positive" || name === "neutral" || name === "negative")) {
              return [`${value} articles`, capitalizeSentiment(name)]
            }
            return [`${value}`, name]
          }}
        />
        <Legend />
        <Bar dataKey="positive" name="Positive" stackId="a" fill="#10b981" />
        <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#6b7280" />
        <Bar dataKey="negative" name="Negative" stackId="a" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  )
}
