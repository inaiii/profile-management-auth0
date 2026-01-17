"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon } from "@hugeicons/core-free-icons"

import type { Auth0User } from "@/lib/auth0-types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

function initialsFrom(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function roleLabel(user: Auth0User) {
  const roles = user.app_metadata?.roles ?? []
  return roles.length ? roles[0] : "Standard"
}

function statusLabel(user: Auth0User) {
  if (user.blocked) {
    return "Blocked"
  }
  return user.last_login ? "Active" : "Invited"
}

function statusVariant(user: Auth0User): BadgeVariant {
  if (user.blocked) {
    return "destructive"
  }
  return user.last_login ? "default" : "secondary"
}

export function UsersTable({ users }: { users: Auth0User[] }) {
  const [query, setQuery] = React.useState("")

  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return users
    }
    return users.filter((user) => {
      const target = [user.name, user.email, user.user_id, user.nickname]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return target.includes(normalized)
    })
  }, [query, users])

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>User directory</CardTitle>
          <CardDescription>
            Review identity status, roles, and last login activity.
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <Badge variant="secondary">{users.length} users</Badge>
            <Badge variant="outline">Management API</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputGroup className="bg-background">
            <InputGroupAddon>
              <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, or user id"
            />
          </InputGroup>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Logins</TableHead>
                <TableHead className="text-right">Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const profileHref = `/admin/users/${encodeURIComponent(
                  user.user_id
                )}/profile`

                return (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          {user.picture ? (
                            <AvatarImage src={user.picture} alt={user.name ?? ""} />
                          ) : null}
                          <AvatarFallback>
                            {initialsFrom(user.name ?? user.email ?? "U")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-medium">
                            {user.name ?? "Unnamed"}
                          </div>
                          <div className="truncate text-[11px] text-muted-foreground">
                            {user.email ?? user.user_id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{roleLabel(user)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(user)}>
                        {statusLabel(user)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString()
                        : "Pending"}
                    </TableCell>
                    <TableCell>{user.logins_count ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="xs">
                        <Link href={profileHref}>View / Edit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!filtered.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    No users match the current search.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-between">
          <div className="text-muted-foreground text-xs">
            Showing {filtered.length} of {users.length} identities.
          </div>
          <Button variant="outline" size="sm">
            Export CSV
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
