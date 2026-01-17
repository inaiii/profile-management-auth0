"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Separator } from "@/components/ui/separator"

type AppShellProps = {
  children: React.ReactNode
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
  isAdmin?: boolean
}

type BreadcrumbItemShape = {
  label: string
  href: string
}

const formatSegment = (segment: string) =>
  segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())

const getInitials = (name?: string | null) => {
  if (!name) {
    return "U"
  }

  const parts = name.trim().split(/\s+/)
  const initials = parts
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")

  return initials.toUpperCase() || "U"
}

export default function AppShell({ children, user, isAdmin }: AppShellProps) {
  const pathname = usePathname()
  const crumbs = React.useMemo<BreadcrumbItemShape[]>(() => {
    const segments = pathname.split("?")[0].split("/").filter(Boolean)
    const items: BreadcrumbItemShape[] = [{ label: "Home", href: "/" }]
    let href = ""

    segments.forEach((segment) => {
      href += `/${segment}`
      items.push({ label: formatSegment(segment), href })
    })

    return items
  }, [pathname])

  const isAuthenticated = Boolean(user)
  const displayName = user?.name || "Guest"
  const displayEmail = user?.email || (isAuthenticated ? "" : "Not signed in")
  const navItems = [
    { label: "Dashboard", href: "/" },
    { label: "Profile", href: "/profile" },
    ...(isAdmin ? [{ label: "Users", href: "/admin/users" }] : []),
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-4 py-5 md:grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarImage src="/favicon.ico" alt="Site logo" />
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <Button asChild variant="link" className="h-auto p-0 text-sm">
                  <Link href="/">Identity Console</Link>
                </Button>
                <Badge variant="outline" className="w-fit text-[10px]">
                  Profile Management
                </Badge>
              </div>
            </div>

            <div className="flex justify-start md:justify-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {navItems.map((item) => (
                    <NavigationMenuItem key={item.href}>
                      <NavigationMenuLink
                        asChild
                        className={navigationMenuTriggerStyle()}
                      >
                        <Link href={item.href}>{item.label}</Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            <div className="flex items-center justify-start gap-3 md:justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-auto items-center gap-2 px-2 py-1.5"
                  >
                    <Avatar size="sm">
                      <AvatarImage src={user?.image || ""} alt={displayName} />
                      <AvatarFallback>
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-xs font-medium">{displayName}</p>
                      {displayEmail ? (
                        <p className="text-[10px] text-muted-foreground">
                          {displayEmail}
                        </p>
                      ) : null}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAuthenticated ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Profile</Link>
                      </DropdownMenuItem>
                      {isAdmin ? (
                        <DropdownMenuItem asChild>
                          <Link href="/admin/users">User management</Link>
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/auth/logout">Sign out</Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href="/auth/login">Sign in</Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <Separator />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="py-4">
            <Breadcrumb>
              <BreadcrumbList>
                {crumbs.map((item, index) => {
                  const isLast = index === crumbs.length - 1

                  return (
                    <React.Fragment key={item.href}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{item.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link href={item.href}>{item.label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast ? <BreadcrumbSeparator /> : null}
                    </React.Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="pb-12">{children}</div>
        </div>
      </main>

      <Separator />

      <footer className="bg-background">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {new Date().getFullYear()} Identity Console
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="link" size="sm" className="h-auto p-0">
              <Link href="/profile">Support</Link>
            </Button>
            <Button asChild variant="link" size="sm" className="h-auto p-0">
              <Link href="/profile">Privacy</Link>
            </Button>
            <Button asChild variant="link" size="sm" className="h-auto p-0">
              <Link href="/profile">Terms</Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
