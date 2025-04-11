"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, BarChart2, Clock, Newspaper, Power, FileText } from "lucide-react"
import { useState, useEffect } from "react"
import { Loader2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { topicsApi, summaryApi } from "@/lib/api"
import { useRouter } from "next/navigation"

interface TopicCardProps {
  topic: {
    _id: string
    name: string
    description: string
    articleCount: number
    lastUpdated: string
    sentiment: {
      positive: number
      neutral: number
      negative: number
    }
    isActive: boolean
  }
  onDelete?: (topicId: string) => void
  onToggleActive?: (topicId: string, isActive: boolean) => void
}

interface TopicSummary {
  summary: string
  sentimentOverview: {
    overall: string
    positive: number
    neutral: number
    negative: number
  }
}

export function TopicCard({ topic, onDelete, onToggleActive }: TopicCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [summary, setSummary] = useState<TopicSummary | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [isTogglingActive, setIsTogglingActive] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [localIsActive, setLocalIsActive] = useState(topic.isActive)
  const router = useRouter()
  
  // Add state to control dialog visibility
  const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    setLocalIsActive(topic.isActive)
  }, [topic.isActive])

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoadingSummary(true)
      try {
        const response = await summaryApi.getTopicSummary(topic._id)
        setSummary(response.summary)
      } catch (err) {
        console.error("Error fetching topic summary:", err)
      } finally {
        setIsLoadingSummary(false)
      }
    }

    fetchSummary()
  }, [topic._id])

  const handleDeleteTopic = async () => {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await topicsApi.deleteTopic(topic._id)
      // Close the dialog
      setIsDeleteDialogOpen(false)
      
      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete(topic._id)
      } else {
        // If no callback is provided, refresh the page
        router.refresh()
      }
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete topic")
      console.error("Error deleting topic:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActive = async () => {
    setIsTogglingActive(true)
    setToggleError(null)
    
    try {
      await topicsApi.updateTopic(topic._id, {
        isActive: !localIsActive
      })
      
      // Update local state first for immediate UI feedback
      setLocalIsActive(!localIsActive)
      
      // Close the dialog
      setIsToggleDialogOpen(false)
      
      // Call the onToggleActive callback if provided
      if (onToggleActive) {
        onToggleActive(topic._id, !localIsActive)
      } else {
        // If no callback is provided, refresh the page
        router.refresh()
      }
    } catch (err: any) {
      setToggleError(err.message || `Failed to ${localIsActive ? 'pause' : 'activate'} topic`)
      console.error("Error toggling topic active status:", err)
    } finally {
      setIsTogglingActive(false)
    }
  }

  // Get sentiment badge variant
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "positive":
        return "default"
      case "neutral":
        return "secondary"
      case "negative":
        return "destructive"
      default:
        return "secondary"
    }
  }

  // Get the highest sentiment value
  const getHighestSentiment = () => {
    if (!summary?.sentimentOverview) return null;
    
    const { positive, neutral, negative } = summary.sentimentOverview;
    
    if (positive >= neutral && positive >= negative) {
      return { type: "positive", value: positive };
    } else if (neutral >= positive && neutral >= negative) {
      return { type: "neutral", value: neutral };
    } else {
      return { type: "negative", value: negative };
    }
  }

  // Format the sentiment label based on type
  const formatSentimentLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  // Get a summary snippet (first 100 characters)
  const summarySnippet = summary?.summary 
    ? `${summary.summary.substring(0, 100)}${summary.summary.length > 100 ? '...' : ''}`
    : 'No summary available';

  // Get the highest sentiment
  const highestSentiment = getHighestSentiment();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{topic.name}</CardTitle>
          <Badge variant={localIsActive ? "default" : "outline"}>{localIsActive ? "Active" : "Paused"}</Badge>
        </div>
        <CardDescription>{topic.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex flex-col space-y-3">
          
          <div className="flex items-center text-sm">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Last updated {topic.lastUpdated}</span>
          </div>
          <div className="flex items-center text-sm">
            <BarChart2 className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Sentiment: </span>
            {isLoadingSummary ? (
              <Loader2 className="ml-2 h-3 w-3 animate-spin" />
            ) : highestSentiment ? (
              <Badge variant={getBadgeVariant(highestSentiment.type)} className="ml-2">
                {formatSentimentLabel(highestSentiment.type)} {highestSentiment.value}%
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-2">Not available</Badge>
            )}
          </div>
          
          {/* Summary Section */}
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center text-sm mb-2">
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Summary</span>
              {isLoadingSummary && <Loader2 className="ml-2 h-3 w-3 animate-spin" />}
            </div>
            <p className="text-xs text-muted-foreground">{summarySnippet}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-4 border-t">
        <Link href={`/topics/${topic._id}`} className="w-full mr-2">
          <Button variant="default" className="w-full">
            <MessageSquare className="mr-2 h-4 w-4" />
            View & Chat
          </Button>
        </Link>
        <div className="flex space-x-2">
          {/* Power button - direct trigger without AlertDialogTrigger */}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsToggleDialogOpen(true)}
          >
            <Power className={`h-4 w-4 ${localIsActive ? "text-red-500" : "text-green-500"}`} />
          </Button>
          
          {/* Toggle Alert Dialog */}
          <AlertDialog open={isToggleDialogOpen} onOpenChange={setIsToggleDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{localIsActive ? 'Pause' : 'Activate'} Topic</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to {localIsActive ? 'pause' : 'activate'} the topic "{topic.name}"?
                  {localIsActive 
                    ? " When paused, no new articles will be collected for this topic."
                    : " When active, we'll start collecting new articles about this topic."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {toggleError && (
                <div className="bg-destructive/10 text-destructive p-2 rounded-md text-sm mb-4">{toggleError}</div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isTogglingActive}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    handleToggleActive()
                  }}
                  disabled={isTogglingActive}
                  className={localIsActive 
                    ? "bg-amber-500 text-white hover:bg-amber-600" 
                    : "bg-green-500 text-white hover:bg-green-600"}
                >
                  {isTogglingActive ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {localIsActive ? 'Pausing...' : 'Activating...'}
                    </>
                  ) : (
                    localIsActive ? 'Pause Topic' : 'Activate Topic'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete button - direct trigger without AlertDialogTrigger */}
          <Button 
            variant="outline" 
            size="icon" 
            className="text-red-500"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          
          {/* Delete Alert Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Topic</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the topic "{topic.name}"? This action cannot be undone and will remove
                  all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {deleteError && (
                <div className="bg-destructive/10 text-destructive p-2 rounded-md text-sm mb-4">{deleteError}</div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    handleDeleteTopic()
                  }}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  )
}