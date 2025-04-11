"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "@/components/ui/chart"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { newsApi } from "@/lib/api"

interface TopKeywordsChartProps {
  topicId: string
  timeframe?: string
  source?: string
}

export function TopKeywordsChart({ topicId, timeframe = "7d", source }: TopKeywordsChartProps) {
  const [keywordData, setKeywordData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchKeywordData = async () => {
      try {
        setLoading(true)
        
        // Fetch sentiment analysis data
        const response = await newsApi.getSentimentAnalysis(topicId, timeframe)
        
        if (source) {
          // If source filter is provided, fetch news data specifically for that source
          const newsResponse = await newsApi.getNewsForTopic(topicId, {
            source: source,
            limit: 100
          })
          
          // Extract keywords from the filtered news data
          const keywords: Record<string, number> = {}
          
          // Process each article to extract keywords
          newsResponse.news.forEach((article: any) => {
            if (article.keywords && Array.isArray(article.keywords)) {
              article.keywords.forEach((keyword: string) => {
                keywords[keyword] = (keywords[keyword] || 0) + 1
              })
            }
          })
          
          // Convert to array format and sort by count
          const keywordsArray = Object.entries(keywords).map(([keyword, count]) => ({
            _id: keyword,
            count: count
          })).sort((a, b) => b.count - a.count).slice(0, 15)
          
          // Transform the data for the chart
          const transformedData = keywordsArray.map((keyword: any, index: number) => ({
            keyword: keyword._id,
            count: keyword.count,
            color: getColorForIndex(index),
          }))
          
          setKeywordData(transformedData)
        } else {
          // If no source filter, use the original sentiment analysis data
          const transformedData = response.sentiment.topKeywords.map((keyword: any, index: number) => ({
            keyword: keyword._id,
            count: keyword.count,
            color: getColorForIndex(index),
          }))
          
          setKeywordData(transformedData)
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch keyword data")
        console.error("Error fetching keyword data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchKeywordData()
  }, [topicId, timeframe, source])

  const getColorForIndex = (index: number) => {
    const colors = [
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#f43f5e",
      "#ef4444",
      "#f97316",
      "#eab308",
      "#84cc16",
      "#10b981",
      "#06b6d4",
    ]
    return colors[index % colors.length]
  }

  const truncateKeyword = (keyword: string) => {
    return keyword.length > 15 ? `${keyword.substring(0, 15)}...` : keyword;
  }

  const processedKeywordData = keywordData.map(item => ({
    ...item,
    originalKeyword: item.keyword,
    keyword: truncateKeyword(item.keyword)
  }));

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

  if (keywordData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <p className="text-muted-foreground">
          {source 
            ? `No keyword data available for source: ${source}` 
            : "No keyword data available"}
        </p>
      </div>
    )
  }

  const chartHeight = Math.max(400, processedKeywordData.length * 50);

  return (
    <div style={{ height: `${chartHeight}px`, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={processedKeywordData}
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
          <YAxis 
            type="category" 
            dataKey="keyword" 
            width={120} 
            tick={{ fontSize: 12 }} 
          />
          <Tooltip 
            formatter={(value, name, props) => {
              const item = props.payload;
              return [`${value} mentions`, item.originalKeyword];
            }} 
          />
          <Bar dataKey="count" name="Mentions" radius={[0, 4, 4, 0]}>
            {processedKeywordData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}