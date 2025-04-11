"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "@/components/ui/chart"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { newsApi } from "@/lib/api"

interface SourceComparisonChartProps {
  topicId: string
  timeframe?: string
}

export function SourceComparisonChart({ topicId, timeframe = "7d" }: SourceComparisonChartProps) {
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

        // Process the data to get article count by source
        const sourceMap = new Map()

        // Process each article
        response.news.forEach((article: any) => {
          const sourceName = article.source.name

          if (!sourceMap.has(sourceName)) {
            sourceMap.set(sourceName, {
              name: sourceName,
              articles: 0,
            })
          }

          const sourceStats = sourceMap.get(sourceName)
          sourceStats.articles++
        })

        // Convert to array and sort by article count
        const sourcesArray = Array.from(sourceMap.values())
          .sort((a, b) => b.articles - a.articles)
          .slice(0, 8) // Get top 8 sources

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
        <p className="text-muted-foreground">No source data available</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={sourceData}
        layout="vertical"
        margin={{
          top: 20,
          right: 30,
          left: 120,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" />
        <Tooltip formatter={(value) => [`${value} articles`, "Count"]} />
        <Legend />
        <Bar dataKey="articles" name="Number of Articles" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  )
}
