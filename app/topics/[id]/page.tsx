"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  BarChart2,
  MessageSquare,
  Newspaper,
  Power,
  Loader2,
  AlertCircle,
  FileText,
  ExternalLink,
  LayoutDashboard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SentimentChart } from "@/components/sentiment-chart";
import { ArticleList } from "@/components/article-list";
import { ChatInterface } from "@/components/chat-interface";
import { TopicSummary } from "@/components/topic-summary";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { topicsApi, newsApi } from "@/lib/api";

interface TopicPageProps {
  params: { id: string };
}

export default function TopicPage({ params }: TopicPageProps) {
  const [topic, setTopic] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchTopicData = async () => {
      try {
        setLoading(true);
        // Fetch topic details
        const topicResponse = await topicsApi.getTopicById(params.id);
        setTopic(topicResponse.topic);
        setIsActive(topicResponse.topic.isActive);

        // Fetch news stats
        const statsResponse = await newsApi.getNewsStats(params.id);
        setStats(statsResponse.stats);
      } catch (err: any) {
        setError(err.message || "Failed to fetch topic data");
        console.error("Error fetching topic data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopicData();
  }, [params.id]);

  const toggleTopicStatus = async () => {
    try {
      setIsUpdating(true);
      const updatedTopic = await topicsApi.updateTopic(params.id, {
        isActive: !isActive,
      });
      setTopic(updatedTopic.topic);
      setIsActive(updatedTopic.topic.isActive);
    } catch (err: any) {
      setError(err.message || "Failed to update topic status");
      console.error("Error updating topic status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const triggerManualScrape = async () => {
    try {
      setIsUpdating(true);
      await topicsApi.triggerScrape(params.id);
      // Refresh stats after scraping
      const statsResponse = await newsApi.getNewsStats(params.id);
      setStats(statsResponse.stats);
    } catch (err: any) {
      setError(err.message || "Failed to trigger scraping");
      console.error("Error triggering scraping:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Failed to load topic"}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{topic.name}</h1>
            <Badge variant={isActive ? "default" : "outline"} className="ml-3">
              {isActive ? "Active" : "Paused"}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={triggerManualScrape}
              disabled={isUpdating || !isActive}
              className="text-blue-500"
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Newspaper className="mr-2 h-4 w-4" />
              )}
              Scrape Now
            </Button>
            <Button
              variant="outline"
              onClick={toggleTopicStatus}
              disabled={isUpdating}
              className={isActive ? "text-red-500" : "text-green-500"}
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Power className="mr-2 h-4 w-4" />
              )}
              {isActive ? "Stop Monitoring" : "Resume Monitoring"}
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground">{topic.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Newspaper className="mr-2 h-4 w-4" />
                Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalArticles || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Last updated {new Date(topic.updatedAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart2 className="mr-2 h-4 w-4" />
                Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                {stats?.sentimentDistribution ? (
                  <>
                    <Badge variant="default" className="flex items-center">
                      <span className="mr-1">
                        {stats.sentimentDistribution.find(
                          (s: any) => s._id === "positive"
                        )?.count || 0}
                      </span>{" "}
                      Positive
                    </Badge>
                    <Badge variant="secondary" className="flex items-center">
                      <span className="mr-1">
                        {stats.sentimentDistribution.find(
                          (s: any) => s._id === "neutral"
                        )?.count || 0}
                      </span>{" "}
                      Neutral
                    </Badge>
                    <Badge variant="destructive" className="flex items-center">
                      <span className="mr-1">
                        {stats.sentimentDistribution.find(
                          (s: any) => s._id === "negative"
                        )?.count || 0}
                      </span>{" "}
                      Negative
                    </Badge>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No sentiment data available
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Ask questions about {topic.name} and get AI-powered insights
              </p>
            </CardContent>
          </Card>

          {/* New Navigation Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Link href={`/topics/${params.id}/analytics`} className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  View Complete Analytics
                </Button>
              </Link>
              <Link href={`/topics/${params.id}/sources`} className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Newspaper className="mr-2 h-4 w-4" />
                  View Sources
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Topic Summary Section */}
        <TopicSummary topicId={params.id} topicName={topic.name} />

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="articles">
              <Newspaper className="mr-2 h-4 w-4" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart2 className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
            
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <ChatInterface topicName={topic.name} topicId={params.id} />
          </TabsContent>

          <TabsContent value="articles" className="mt-6">
            <ArticleList topicId={params.id} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Analysis</CardTitle>
                <CardDescription>
                  Sentiment trend for articles about {topic.name} over the past
                  week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SentimentChart topicId={params.id} />
              </CardContent>
            </Card>
          </TabsContent>

         
        </Tabs>
      </div>
    </div>
  );
}