"use client"

import { useState, useEffect } from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "@/components/ui/chart"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { newsApi } from "@/lib/api"

interface SourcesDistributionChartProps {
  topicId: string
}

export function SourcesDistributionChart({ topicId }: SourcesDistributionChartProps) {
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
              articleCount: 0,
              lastArticle: article.publishedAt,
            })
          }

          const sourceStats = sourceMap.get(sourceName)
          sourceStats.articleCount++

          // Update last article date if this one is more recent
          if (new Date(article.publishedAt) > new Date(sourceStats.lastArticle)) {
            sourceStats.lastArticle = article.publishedAt
          }
        })

        // Convert to array and sort by article count
        const sourcesArray = Array.from(sourceMap.values()).sort((a, b) => b.articleCount - a.articleCount)

        setSourceData(sourcesArray)
      } catch (err: any) {
        setError(err.message || "Failed to fetch source data")
        console.error("Error fetching source data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSourceData()
  }, [topicId])

  // If in loading state
  if (loading) {
    return (
      <div className="flex flex-col gap-6 h-full">
        <div className="w-full rounded-lg border bg-card p-4 shadow flex justify-center items-center" style={{ height: '300px' }}>
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  // If there's an error
  if (error) {
    return (
      <div className="flex flex-col gap-6 h-full">
        <div className="w-full rounded-lg border bg-card p-4 shadow">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // If no data available
  if (sourceData.length === 0) {
    return (
      <div className="flex flex-col gap-6 h-full">
        <div className="w-full rounded-lg border bg-card p-4 shadow flex justify-center items-center" style={{ height: '300px' }}>
          <p className="text-muted-foreground">No source data available</p>
        </div>
      </div>
    )
  }

  // Get the top 5 sources
  const top5Sources = sourceData.slice(0, 5);
  
  // Calculate the sum of all remaining sources
  const otherSourcesCount = sourceData.slice(5).reduce((sum, source) => sum + source.articleCount, 0);
  
  // Process data for the pie chart - top 5 plus "Others"
  const pieData = [
    ...top5Sources.map((source) => ({
      name: source.name,
      value: source.articleCount,
    }))
  ];
  
  // Add "Others" category if there are more than 5 sources
  if (otherSourcesCount > 0) {
    pieData.push({
      name: "Others",
      value: otherSourcesCount
    });
  }

  // Colors for the pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

  // For the bar chart
  const barData = [...top5Sources]
    .map((source) => ({
      name: source.name,
      articles: source.articleCount,
    }))

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="w-full rounded-lg border bg-card p-4 shadow">
        <h3 className="text-sm font-medium mb-4 px-2">Distribution by Source (Top 5)</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} articles`, "Count"]} />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                wrapperStyle={{ paddingTop: 20 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="w-full rounded-lg border bg-card p-4 shadow">
        <h3 className="text-sm font-medium mb-4 px-2">Top 5 Sources (Bar)</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              layout="vertical"
              margin={{
                top: 5,
                right: 30,
                left: 80,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={80} 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
              />
              <Tooltip 
                formatter={(value) => [`${value} articles`, "Count"]} 
                contentStyle={{ fontSize: '12px' }}
              />
              <Bar dataKey="articles" name="Articles" fill="#0088FE" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}