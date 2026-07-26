"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, User as UserIcon, Menu, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth";
import { FeedbackModal } from "@/components/feedback/feedback-modal";
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
  };
}

export function TopNav({ user }: TopNavProps) {
  const pathname = usePathname();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-16 items-center px-4 md:px-8 max-w-[1440px] mx-auto w-full">
        <div className="flex items-center gap-3 md:gap-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden text-muted-foreground hover:text-foreground" 
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 mt-2">
              <DropdownMenuLabel>Navigation</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link 
                  href="/" 
                  className={cn(
                    "w-full cursor-pointer",
                    pathname === "/" ? "font-bold text-foreground" : "text-muted-foreground"
                  )}
                >
                  Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link 
                  href="/sales" 
                  className={cn(
                    "w-full cursor-pointer",
                    pathname === "/sales" ? "font-bold text-foreground" : "text-muted-foreground"
                  )}
                >
                  Sales Log
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFeedbackOpen(true)} className="cursor-pointer">
                <MessageSquarePlus className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span>Send Feedback / Bugs</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
            Split
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium h-16">
            <Link 
              href="/" 
              className={cn(
                "h-full flex items-center border-b-2 transition-colors hover:text-foreground",
                pathname === "/" 
                  ? "border-foreground text-foreground" 
                  : "border-transparent text-muted-foreground"
              )}
            >
              Analytics
            </Link>
            <Link 
              href="/sales" 
              className={cn(
                "h-full flex items-center border-b-2 transition-colors hover:text-foreground",
                pathname === "/sales" 
                  ? "border-foreground text-foreground" 
                  : "border-transparent text-muted-foreground"
              )}
            >
              Sales Log
            </Link>
          </nav>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFeedbackOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-medium"
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
            <span>Feedback & Bugs</span>
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground mr-1"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Notifications</span>
          </Button>

          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="Open user menu">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || ""}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile" className="flex items-center w-full">
                      <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFeedbackOpen(true)} className="cursor-pointer">
                    <MessageSquarePlus className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span>Send Feedback / Bugs</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will end your current session and you will need to log in again to access your data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => logoutAction()}>
                  Sign out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
        </div>
      </div>
    </header>
  );
}