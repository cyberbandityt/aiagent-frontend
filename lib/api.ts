// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3112/api"

// Helper function for making authenticated API requests
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // Get token from localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  // If we have a token, also set it as a cookie for the middleware
  if (token && typeof window !== "undefined") {
    document.cookie = `token=${token}; path=/; max-age=604800` // 7 days
  }
  // Ensure we have the proper headers structure
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }), // Make sure "Bearer " prefix is included
    ...options.headers,
  }

  // Log the request details for debugging (remove in production)


  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    // For non-JSON responses
    if (!response.headers.get("content-type")?.includes("application/json")) {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      return await response.text()
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong")
    }

    return data
  } catch (error) {
    throw error
  }
}

// Auth API
export const authApi = {
  register: async (userData: { name: string; email: string; password: string }) => {
    return fetchWithAuth("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await fetchWithAuth("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })

    // Ensure token is properly stored
    if (response.token) {
      localStorage.setItem("token", response.token)
      // Also set as cookie
      document.cookie = `token=${response.token}; path=/; max-age=604800` // 7 days
    }

    return response
  },

  getCurrentUser: async () => {
    return fetchWithAuth("/auth/user")
  },
}

// Topics API
export const topicsApi = {
  createTopic: async (topicData: {
    name: string
    keywords: string[]
    description: string
    sources?: string[]
  }) => {
    return fetchWithAuth("/topics", {
      method: "POST",
      body: JSON.stringify(topicData),
    })
  },

  getAllTopics: async () => {
    return fetchWithAuth("/topics")
  },

  getTopicById: async (id: string) => {
    return fetchWithAuth(`/topics/${id}`)
  },

  updateTopic: async (
    id: string,
    topicData: {
      name?: string
      keywords?: string[]
      description?: string
      isActive?: boolean
    },
  ) => {
    return fetchWithAuth(`/topics/${id}`, {
      method: "PUT",
      body: JSON.stringify(topicData),
    })
  },

  deleteTopic: async (id: string) => {
    return fetchWithAuth(`/topics/${id}`, {
      method: "DELETE",
    })
  },

  triggerScrape: async (id: string) => {
    return fetchWithAuth(`/topics/${id}/scrape`, {
      method: "POST",
    })
  },
}

// News API
export const newsApi = {
  getNewsForTopic: async (
    topicId: string,
    params: {
      sentiment?: string
      from?: string
      to?: string
      source?: string
      sortBy?: string
      page?: number
      limit?: number
    } = {},
  ) => {
    const queryParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString())
      }
    })

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return fetchWithAuth(`/news/topic/${topicId}${queryString}`)
  },

  getSentimentAnalysis: async (topicId: string, timeframe?: string) => {
    const queryString = timeframe ? `?timeframe=${timeframe}` : ""
    return fetchWithAuth(`/news/sentiment/${topicId}${queryString}`)
  },

  getNewsById: async (id: string) => {
    return fetchWithAuth(`/news/${id}`)
  },

  searchNews: async (topicId: string, query: string, page?: number, limit?: number) => {
    const queryParams = new URLSearchParams({ query })
    if (page) queryParams.append("page", page.toString())
    if (limit) queryParams.append("limit", limit.toString())

    return fetchWithAuth(`/news/search/${topicId}?${queryParams.toString()}`)
  },

  getNewsStats: async (topicId: string, days?: number) => {
    const queryString = days ? `?days=${days}` : ""
    return fetchWithAuth(`/news/stats/${topicId}${queryString}`)
  },
}

// Chat API
export const chatApi = {
  getChatHistory: async (topicId: string, page?: number, limit?: number) => {
    const queryParams = new URLSearchParams()
    if (page) queryParams.append("page", page.toString())
    if (limit) queryParams.append("limit", limit.toString())

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
    return fetchWithAuth(`/chat/topic/${topicId}/history${queryString}`)
  },

  sendMessage: async (topicId: string, message: string) => {
    return fetchWithAuth(`/chat/topic/${topicId}`, {
      method: "POST",
      body: JSON.stringify({ message }),
    })
  },

  clearChatHistory: async (topicId: string) => {
    return fetchWithAuth(`/chat/topic/${topicId}/history`, {
      method: "DELETE",
    })
  },
}

// Summary API
export const summaryApi = {
  getTopicSummary: async (topicId: string) => {
    return fetchWithAuth(`/summary/topic/${topicId}`)
  },

  generateTopicSummary: async (topicId: string) => {
    return fetchWithAuth(`/summary/topic/${topicId}/generate`, {
      method: "POST",
    })
  },
}

