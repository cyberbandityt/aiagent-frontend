"use client"

import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "@/components/ui/chart"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { newsApi } from "@/lib/api"

interface SentimentTrendChartProps {
  topicId: string
  timeframe?: string
  source?: string
}

export function SentimentTrendChart({ topicId, timeframe = "7d", source }: SentimentTrendChartProps) {
  const [sentimentData, setSentimentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        setLoading(true)
        
        if (source) {
          // If source filter is applied, fetch and process source-specific data
          const newsResponse = await newsApi.getNewsForTopic(topicId, {
            source: source,
            limit: 100
          })
          
          // Process the news data to extract sentiment trends
          const news = newsResponse.news || []
          
          // Daily sentiment tracking
          const dailySentimentMap = new Map()
          
          // Process each article
          news.forEach((article:any) => {
            const sentiment = article?.sentiment?.label || 'neutral'
            const score = article?.sentiment?.score || 0
            const date = new Date(article?.publishedAt).toISOString().split('T')[0]
            
            if (!dailySentimentMap.has(date)) {
              dailySentimentMap.set(date, {
                positive: 0,
                neutral: 0,
                negative: 0,
                positiveScore: 0,
                neutralScore: 0,
                negativeScore: 0
              })
            }
            
            const dayData = dailySentimentMap.get(date)
            dayData[sentiment]++
            dayData[`${sentiment}Score`] += score
          })
          
          // Format daily sentiment data
          const dailySentiment = Array.from(dailySentimentMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, counts]) => {
              // Calculate average scores
              const positiveAvg = counts.positive > 0 ? counts.positiveScore / counts.positive : 0
              const neutralAvg = counts.neutral > 0 ? counts.neutralScore / counts.neutral : 0
              const negativeAvg = counts.negative > 0 ? counts.negativeScore / counts.negative : 0
              
              // Format sentiments for this day
              const sentiments = [
                { label: 'positive', count: counts.positive, avgScore: positiveAvg },
                { label: 'neutral', count: counts.neutral, avgScore: neutralAvg },
                { label: 'negative', count: counts.negative, avgScore: negativeAvg }
              ]
              
              return {
                _id: date,
                sentiments
              }
            })
          
          setSentimentData({ dailySentiment })
        } else {
          // No source filter, use regular API
          const response = await newsApi.getSentimentAnalysis(topicId, timeframe)
          setSentimentData(response.sentiment)
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch sentiment data")
        console.error("Error fetching sentiment data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSentimentData()
  }, [topicId, timeframe, source])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !sentimentData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || "Failed to load sentiment data"}</AlertDescription>
      </Alert>
    )
  }

  // Transform daily sentiment data for the charts
  const dailyData = sentimentData.dailySentiment.map((day: any) => {
    const date = day._id
    const dataPoint: any = { date }

    day.sentiments.forEach((sentiment: any) => {
      dataPoint[sentiment.label] = sentiment.count
      dataPoint[`${sentiment.label}Score`] = sentiment.avgScore
    })

    return dataPoint
  })

  // If no data is available
  if (dailyData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <p className="text-muted-foreground">
          {source 
            ? `No sentiment trend data available for source: ${source}` 
            : "No sentiment trend data available for the selected period"}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      <div>
        <h3 className="text-sm font-medium mb-2 text-center">Sentiment Trend (Line)</h3>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart
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
            <Tooltip
              formatter={(value, name, props) => {
                if (name === "positive" || name === "neutral" || name === "negative") {
                  return [`${value} articles`, name.charAt(0).toUpperCase() + name.slice(1)]
                }
                return [value, name]
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="positive" name="Positive" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="neutral" name="Neutral" stroke="#6b7280" strokeWidth={2} />
            <Line type="monotone" dataKey="negative" name="Negative" stroke="#ef4444" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-center">Sentiment Trend (Stacked)</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart
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
            <Tooltip
              formatter={(value, name, props) => {
                if (name === "positive" || name === "neutral" || name === "negative") {
                  return [`${value} articles`, name.charAt(0).toUpperCase() + name.slice(1)]
                }
                return [value, name]
              }}
            />
            <Legend />
            <Bar dataKey="positive" name="Positive" stackId="a" fill="#10b981" />
            <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#6b7280" />
            <Bar dataKey="negative" name="Negative" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}