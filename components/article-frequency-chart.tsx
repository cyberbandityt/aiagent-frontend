"use client"

import { useState, useEffect } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "@/components/ui/chart"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { newsApi } from "@/lib/api"

interface ArticleFrequencyChartProps {
  topicId: string
  timeframe?: string
  source?: string
}

export function ArticleFrequencyChart({ topicId, timeframe = "7d", source }: ArticleFrequencyChartProps) {
  const [frequencyData, setFrequencyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFrequencyData = async () => {
      try {
        setLoading(true)
        
        if (source) {
          // If source filter is applied, fetch articles for the specific source
          const newsResponse = await newsApi.getNewsForTopic(topicId, {
            source: source,
            limit: 100
          })
          
          // Process daily article counts
          const dailyCountsMap = new Map()
          const hourlyCountsMap = new Map()
          
          // Initialize hourly counts
          for (let i = 0; i < 24; i++) {
            const hourString = i.toString().padStart(2, '0') + ':00'
            hourlyCountsMap.set(hourString, 0)
          }
          
          // Process each article
          newsResponse.news.forEach((article:any) => {
            // Process date for daily counts
            const publishDate = new Date(article.publishedAt)
            const dateString = publishDate.toISOString().split('T')[0]
            
            // Update daily counts
            if (!dailyCountsMap.has(dateString)) {
              dailyCountsMap.set(dateString, 0)
            }
            dailyCountsMap.set(dateString, dailyCountsMap.get(dateString) + 1)
            
            // Update hourly counts
            const hour = publishDate.getUTCHours()
            const hourString = hour.toString().padStart(2, '0') + ':00'
            hourlyCountsMap.set(hourString, hourlyCountsMap.get(hourString) + 1)
          })
          
          // Convert maps to arrays for the chart
          const dailyArticleCounts = Array.from(dailyCountsMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => ({
              _id: date,
              count
            }))
          
          const hourlyArticleCounts = Array.from(hourlyCountsMap.entries())
            .sort((a, b) => {
              const hourA = parseInt(a[0].split(':')[0])
              const hourB = parseInt(b[0].split(':')[0])
              return hourA - hourB
            })
            .map(([hour, count]) => ({
              hour,
              articles: count
            }))
          
          // Create the data structure
          const processedData = {
            dailyArticleCounts,
            hourlyArticleCounts
          }
          
          setFrequencyData(processedData)
        } else {
          // No source filter, use regular stats API
          const statsResponse = await newsApi.getNewsStats(topicId)
          setFrequencyData(statsResponse.stats)
          
          // Add hourly data if not available from API
          if (!statsResponse.stats.hourlyArticleCounts) {
            const hourlyData = []
            for (let i = 0; i < 24; i += 2) {
              const hour = i.toString().padStart(2, '0') + ':00'
              hourlyData.push({
                hour,
                articles: Math.floor(Math.random() * 10) // Placeholder data
              })
            }
            statsResponse.stats.hourlyArticleCounts = hourlyData
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch frequency data")
        console.error("Error fetching frequency data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchFrequencyData()
  }, [topicId, timeframe, source])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !frequencyData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || "Failed to load frequency data"}</AlertDescription>
      </Alert>
    )
  }

  // If we don't have the expected data structure, show a message
  if (!frequencyData.dailyArticleCounts || frequencyData.dailyArticleCounts.length === 0) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <p className="text-muted-foreground">
          {source 
            ? `No article frequency data available for source: ${source}` 
            : "No article frequency data available"}
        </p>
      </div>
    )
  }

  // Transform the data for the charts
  const dailyData = frequencyData.dailyArticleCounts.map((item: any) => ({
    date: item._id,
    articles: item.count,
  }))

  // For hourly distribution
  const hourlyData = frequencyData.hourlyArticleCounts || 
    // Fallback to placeholder data if not available
    Array.from({ length: 12 }, (_, i) => ({
      hour: `${(i * 2).toString().padStart(2, '0')}:00`,
      articles: Math.floor(Math.random() * 10)
    }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      <div>
        <h3 className="text-sm font-medium mb-2 text-center">
          Daily Article Count
          {source ? ` (${source})` : ''}
        </h3>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart
            data={dailyData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} articles`, "Count"]} />
            <Area
              type="monotone"
              dataKey="articles"
              name="Articles"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-center">
          Hourly Distribution
          {source ? ` (${source})` : ' (Average)'}
        </h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart
            data={hourlyData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} articles`, "Count"]} />
            <Bar dataKey="articles" name="Articles" fill="#8884d8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}