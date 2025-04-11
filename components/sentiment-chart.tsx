"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "@/components/ui/chart"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { newsApi } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Define specific types for sentiment data
interface SentimentCount {
  positive: number;
  neutral: number;
  negative: number;
}

interface SentimentScore {
  positive: number;
  neutral: number;
  negative: number;
}

interface DailySentiment {
  [date: string]: {
    positive: number;
    neutral: number;
    negative: number;
    positiveScore: number;
    neutralScore: number;
    negativeScore: number;
  }
}

interface SentimentChartProps {
  topicId: string
  source?: string
}

export function SentimentChart({ topicId, source }: SentimentChartProps) {
  const [sentimentData, setSentimentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        setLoading(true)
        
        if (source) {
          // If source is specified, fetch news for that specific source
          const newsResponse = await newsApi.getNewsForTopic(topicId, {
            source: source,
            limit: 100
          })
          
          // Process the news data to generate sentiment statistics
          const news = newsResponse.news || []
          
          // Process overall sentiment
          const sentimentCounts: SentimentCount = {
            positive: 0,
            neutral: 0,
            negative: 0
          }
          
          const sentimentScores: SentimentScore = {
            positive: 0,
            neutral: 0,
            negative: 0
          }
          
          // Daily sentiment tracking
          const dailySentimentMap = new Map<string, {
            positive: number;
            neutral: number;
            negative: number;
            positiveScore: number;
            neutralScore: number;
            negativeScore: number;
          }>()
          
          // Keywords tracking
          const keywordsCount: Record<string, number> = {}
          
          news.forEach((article:any) => {
            const sentiment = article.sentiment?.label || 'neutral'
            const score = article.sentiment?.score || 0
            
            // Make sure sentiment is a valid key by explicitly checking
            if (sentiment === 'positive' || sentiment === 'neutral' || sentiment === 'negative') {
              // Update overall counts with explicit type casting
              const typedSentiment = sentiment as keyof SentimentCount
              sentimentCounts[typedSentiment]++
              sentimentScores[typedSentiment] += score
              
              // Update daily sentiment
              const date = new Date(article.publishedAt).toISOString().split('T')[0]
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
              
              const dayData = dailySentimentMap.get(date)!
              // Use type assertion to safely access the property
              dayData[typedSentiment]++
              
              // Use type assertion to access the score property
              const scoreKey = `${typedSentiment}Score` as 'positiveScore' | 'neutralScore' | 'negativeScore'
              dayData[scoreKey] += score
            }
            
            // Update keywords
            if (article.keywords && Array.isArray(article.keywords)) {
              article.keywords.forEach((keyword:any) => {
                keywordsCount[keyword] = (keywordsCount[keyword] || 0) + 1
              })
            }
          })
          
          // Calculate average scores
          Object.keys(sentimentScores).forEach(key => {
            const typedKey = key as keyof SentimentScore
            if (sentimentCounts[typedKey] > 0) {
              sentimentScores[typedKey] /= sentimentCounts[typedKey]
            }
          })
          
          // Format overall sentiment data
          const overallSentiment = Object.keys(sentimentCounts).map(key => {
            const typedKey = key as keyof SentimentCount
            return {
              _id: key,
              count: sentimentCounts[typedKey],
              avgScore: sentimentScores[typedKey]
            }
          })
          
          // Format daily sentiment data
          const dailySentiment = Array.from(dailySentimentMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, counts]) => {
              const sentiments = Object.keys(sentimentCounts)
                .filter(key => key === 'positive' || key === 'neutral' || key === 'negative')
                .map(sentiment => {
                  const typedSentiment = sentiment as keyof typeof counts
                  const count = counts[typedSentiment]
                  const scoreKey = `${sentiment}Score` as keyof typeof counts
                  const avgScore = count > 0 ? counts[scoreKey] / count : 0
                  
                  return {
                    label: sentiment,
                    count,
                    avgScore
                  }
                })
              
              return {
                _id: date,
                sentiments
              }
            })
          
          // Format top keywords
          const topKeywords = Object.entries(keywordsCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([keyword, count]) => ({
              _id: keyword,
              count
            }))
          
          const processedData = {
            overallSentiment,
            dailySentiment,
            topKeywords
          }
          
          setSentimentData(processedData)
        } else {
          // If no source filter, use the regular API
          const response = await newsApi.getSentimentAnalysis(topicId, "7d")
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
  }, [topicId, source])

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

  // Check if we have valid data
  if (!sentimentData.overallSentiment || sentimentData.overallSentiment.length === 0) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <p className="text-muted-foreground">
          {source 
            ? `No sentiment data available for source: ${source}` 
            : "No sentiment data available"}
        </p>
      </div>
    )
  }

  // Transform API data for charts
  const pieData = sentimentData.overallSentiment.map((item: any) => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count,
    score: item.avgScore,
    color: item._id === "positive" ? "#10b981" : item._id === "negative" ? "#ef4444" : "#6b7280",
  }))

  const barData = pieData.map((item: any) => ({
    name: item.name,
    value: item.value,
    score: item.score,
    color: item.color,
  }))

  // Transform daily sentiment data for the line chart
  const dailyData = sentimentData.dailySentiment.map((day: any) => {
    const date = day._id
    const dataPoint: any = { date }

    day.sentiments.forEach((sentiment: any) => {
      dataPoint[sentiment.label] = sentiment.count
      dataPoint[`${sentiment.label}Score`] = sentiment.avgScore
    })

    return dataPoint
  })

  // Transform keyword data
  const keywordData = sentimentData.topKeywords.map((keyword: any) => ({
    keyword: keyword._id,
    count: keyword.count,
    color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`, // Random color
  }))

  const COLORS = ["#10b981", "#6b7280", "#ef4444"]
  const RADIAN = Math.PI / 180

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="trends">Trends</TabsTrigger>
        <TabsTrigger value="keywords">Keywords</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          <div>
            <h3 className="text-sm font-medium mb-2 text-center">Sentiment Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    return [`${value} articles (${props.payload.score.toFixed(2)})`, name]
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2 text-center">Sentiment Counts</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={barData}
                layout="vertical"
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip
                  formatter={(value, name, props) => {
                    return [`${value} articles (score: ${props.payload.score.toFixed(2)})`, "Count"]
                  }}
                />
                <Bar dataKey="value" name="Articles" radius={[0, 4, 4, 0]}>
                  {barData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="trends" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Trends</CardTitle>
            <CardDescription>
              Daily sentiment distribution over time
              {source ? ` for ${source}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
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
                    <Line
                      type="monotone"
                      dataKey="positive"
                      name="Positive"
                      stroke="#10b981"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                    <Line type="monotone" dataKey="neutral" name="Neutral" stroke="#6b7280" strokeWidth={2} />
                    <Line type="monotone" dataKey="negative" name="Negative" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground">No trend data available for the selected period</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="keywords" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Keywords</CardTitle>
            <CardDescription>
              Most frequently mentioned keywords in articles
              {source ? ` from ${source}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              {keywordData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={keywordData}
                    layout="vertical"
                    margin={{
                      top: 20,
                      right: 30,
                      left: 100,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="keyword" />
                    <Tooltip formatter={(value) => [`${value} mentions`, "Count"]} />
                    <Bar dataKey="count" name="Mentions" radius={[0, 4, 4, 0]}>
                      {keywordData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground">No keyword data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}