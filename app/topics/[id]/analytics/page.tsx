"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Calendar, Download, TrendingUp, Loader2, AlertCircle, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SentimentChart } from "@/components/sentiment-chart"
import { SentimentTrendChart } from "@/components/sentiment-trend-chart"
import { TopKeywordsChart } from "@/components/top-keywords-chart"
import { ArticleFrequencyChart } from "@/components/article-frequency-chart"
import { SourceComparisonChart } from "@/components/source-comparison-chart"
import { SentimentBySourceChart } from "@/components/sentiment-by-source-chart"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { topicsApi, newsApi } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge" 

interface AnalyticsPageProps {
  params: { id: string }
}

export default function TopicAnalyticsPage({ params }: AnalyticsPageProps) {
  const searchParams = useSearchParams()
  const sourceFilter = searchParams.get('source')
  
  const [topic, setTopic] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [sourceStats, setSourceStats] = useState<any>(null)
  const [timeframe, setTimeframe] = useState("7d")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingSourceData, setLoadingSourceData] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const topicResponse = await topicsApi.getTopicById(params.id)
        setTopic(topicResponse.topic)

        const statsResponse = await newsApi.getNewsStats(params.id)
        setStats(statsResponse.stats)
      } catch (err: any) {
        setError(err.message || "Failed to fetch data")
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  useEffect(() => {
    const fetchSourceData = async () => {
      if (!sourceFilter) {
        setSourceStats(null)
        return
      }

      try {
        setLoadingSourceData(true)
        // Fetch data filtered by source
        const response = await newsApi.getNewsForTopic(params.id, {
          source: sourceFilter,
          limit: 100
        })

        // Process the data to create source-specific stats
        if (response.news && response.news.length > 0) {
          const sentimentCounts: {
            positive: number;
            neutral: number;
            negative: number;
            [key: string]: number;  // Index signature
          } = {
            positive: 0,
            neutral: 0,
            negative: 0
          }
          response.news.forEach((article: any) => {
            const sentiment = article.sentiment?.label || 'neutral'
            sentimentCounts[sentiment]++
          })

          const totalArticles = response.news.length
          const sourceData = {
            totalArticles,
            sentimentDistribution: [
              { _id: "positive", count: sentimentCounts.positive, percentage: Math.round((sentimentCounts.positive / totalArticles) * 100) },
              { _id: "neutral", count: sentimentCounts.neutral, percentage: Math.round((sentimentCounts.neutral / totalArticles) * 100) },
              { _id: "negative", count: sentimentCounts.negative, percentage: Math.round((sentimentCounts.negative / totalArticles) * 100) },
            ]
          }
          
          setSourceStats(sourceData)
        }
      } catch (err) {
        console.error("Error fetching source data:", err)
      } finally {
        setLoadingSourceData(false)
      }
    }

    fetchSourceData()
  }, [params.id, sourceFilter])

  const clearSourceFilter = () => {
    // Create a URL without the source parameter
    const url = `/topics/${params.id}/analytics`
    window.location.href = url
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !topic) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Failed to load topic"}</AlertDescription>
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

  // Use source stats when available, otherwise use the global stats
  const displayStats = sourceFilter && sourceStats ? sourceStats : stats
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link href={`/topics/${params.id}`}>
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{topic.name}: Analytics</h1>
          <div className="flex items-center">
            <p className="text-muted-foreground">{topic.description}</p>
            {sourceFilter && (
              <Badge variant="secondary" className="ml-3 flex items-center gap-1">
                Source: {sourceFilter}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 rounded-full p-0" 
                  onClick={clearSourceFilter}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center ml-auto space-x-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {loadingSourceData ? (
        <div className="flex justify-center items-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats?.totalArticles || 0}</div>
              {!sourceFilter && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">{stats?.articleGrowth || 0}%</span>
                  <span className="ml-1">from previous period</span>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {displayStats?.sentimentDistribution?.find((s: any) => s._id === "positive")?.percentage || 0}%
              </div>
              {!sourceFilter && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  <span className="text-green-500 font-medium">{stats?.sentimentGrowth?.positive || 0}%</span>
                  <span className="ml-1">from previous period</span>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Negative Sentiment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {displayStats?.sentimentDistribution?.find((s: any) => s._id === "negative")?.percentage || 0}%
              </div>
              {!sourceFilter && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-red-500 rotate-180" />
                  <span className="text-red-500 font-medium">{stats?.sentimentGrowth?.negative || 0}%</span>
                  <span className="ml-1">from previous period</span>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{sourceFilter ? "Source" : "Active Sources"}</CardTitle>
            </CardHeader>
            <CardContent>
              {sourceFilter ? (
                <div className="text-lg font-medium">{sourceFilter}</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.activeSources || 0}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      Last{" "}
                      {timeframe === "1d"
                        ? "24 hours"
                        : timeframe === "7d"
                          ? "7 days"
                          : timeframe === "30d"
                            ? "30 days"
                            : "90 days"}
                    </span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="sentiment" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="frequency">Frequency</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="sentiment" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis</CardTitle>
              <CardDescription>
                Sentiment analysis for articles about {topic.name}
                {sourceFilter ? ` from ${sourceFilter}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <SentimentChart 
                  topicId={params.id} 
                  source={sourceFilter || undefined}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sentiment Trend</CardTitle>
              <CardDescription>
                Sentiment trend over time for {topic.name}
                {sourceFilter ? ` from ${sourceFilter}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <SentimentTrendChart 
                  topicId={params.id} 
                  timeframe={timeframe}
                  source={sourceFilter || undefined} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frequency" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Article Frequency</CardTitle>
              <CardDescription>
                Number of articles published over time
                {sourceFilter ? ` from ${sourceFilter}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ArticleFrequencyChart 
                  topicId={params.id} 
                  timeframe={timeframe}
                  source={sourceFilter || undefined}
                />
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
                {sourceFilter ? ` from ${sourceFilter}` : ''}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="h-[400px]">
                <TopKeywordsChart 
                  topicId={params.id} 
                  timeframe={timeframe}
                  source={sourceFilter || undefined}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="mt-6 space-y-6">
          {sourceFilter ? (
            <Card>
              <CardHeader>
                <CardTitle>Source Analysis: {sourceFilter}</CardTitle>
                <CardDescription>
                  Detailed analysis of articles from {sourceFilter}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">Source Filter Active</h3>
                  <p className="text-muted-foreground mb-4">
                    You're currently viewing analytics for articles from {sourceFilter}.
                  </p>
                  <Button onClick={clearSourceFilter}>
                    View All Sources
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Source Comparison</CardTitle>
                  <CardDescription>Article count comparison across different sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <SourceComparisonChart topicId={params.id} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sentiment by Source</CardTitle>
                  <CardDescription>Sentiment distribution across top news sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <SentimentBySourceChart topicId={params.id} />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}