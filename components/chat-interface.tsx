"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, User, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
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
import { chatApi } from "@/lib/api"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface ChatInterfaceProps {
  topicName: string
  topicId: string
}

export function ChatInterface({ topicName, topicId }: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Fetch chat history when component mounts
  useEffect(() => {
    const fetchChatHistory = async () => {
      setIsFetching(true)
      try {
        const data = await chatApi.getChatHistory(topicId)
        if (data.chatHistory && data.chatHistory.length > 0) {
          setMessages(data.chatHistory)
        } else {
          // Add a welcome message if there's no history
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: `Hello! I'm your AI assistant for the topic "${topicName}". I can provide insights, summarize news, analyze sentiment, and answer questions about this topic. How can I help you today?`,
              timestamp: new Date().toISOString(),
            },
          ])
        }
      } catch (err: any) {
        setError(err.message || "Failed to load chat history")
        console.error("Error fetching chat history:", err)
      } finally {
        setIsFetching(false)
      }
    }

    fetchChatHistory()
  }, [topicId, topicName])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      // Send message to API
      const response = await chatApi.sendMessage(topicId, input)

      // Add AI response to messages
      setMessages((prev) => [...prev, response.response])
    } catch (err: any) {
      setError(err.message || "Failed to send message")
      console.error("Error sending message:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = async () => {
    try {
      await chatApi.clearChatHistory(topicId)
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hello! I'm your AI assistant for the topic "${topicName}". I can provide insights, summarize news, analyze sentiment, and answer questions about this topic. How can I help you today?`,
          timestamp: new Date().toISOString(),
        },
      ])
    } catch (err: any) {
      setError(err.message || "Failed to clear chat history")
      console.error("Error clearing chat history:", err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handleSendMessage()
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Chat with AI about {topicName}</CardTitle>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your chat history with the AI assistant.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearChat}>Clear</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {isFetching
              ? // Loading skeleton
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))
              : // Actual messages
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`flex max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div
                        className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full ${
                          message.role === "user" ? "bg-primary ml-2" : "bg-muted mr-2"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4 text-primary-foreground" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="mt-1 text-xs opacity-70">{formatTimestamp(message.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[80%] flex-row">
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-muted mr-2">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-muted">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce"></div>
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce delay-75"></div>
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-lg px-4 py-2 bg-destructive/10 text-destructive text-sm">
                Error: {error}. Please try again.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder="Ask about this topic..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            disabled={isLoading || isFetching}
          />
          <Button size="icon" onClick={handleSendMessage} disabled={!input.trim() || isLoading || isFetching}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
