"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, PlusCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Navbar() {
  const { user, logout } = useAuth()
  
  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error("Error during logout:", err)
    }
  }

  const getUserInitials = () => {
    if (!user || !user.name) return "U";
    
    const nameParts = user.name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };

  return (
<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
<div className="flex h-16 items-center justify-between w-full px-4">
    <div className="flex items-center gap-2 ml-4">
      <Link href="/" className="flex flex-col">
        <h1 className="text-xl font-bold">News Monitor</h1>
        <p className="text-sm text-muted-foreground">Track topics and get AI-powered insights</p>
      </Link>
    </div>

    <div className="ml-auto flex items-center space-x-4">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
        <Avatar className="h-9 w-9">
          <AvatarFallback>{getUserInitials()}</AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {user && (
        <div className="px-2 py-1.5 text-sm font-medium border-b mb-1">
          {user.name || user.email}
        </div>
      )}
      <DropdownMenuItem 
        className="cursor-pointer text-red-500 focus:text-red-500"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>

  </div>
</header>

  )
}