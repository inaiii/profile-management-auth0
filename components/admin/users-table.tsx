"use client"

import * as React from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon, UserCircle02Icon } from "@hugeicons/core-free-icons"

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const localeOptions = [
  { value: "en-US", label: "English (US)" },
  { value: "de-DE", label: "German" },
  { value: "fr-FR", label: "French" },
  { value: "ja-JP", label: "Japanese" },
] as const

const timezoneOptions = [
  "UTC",
  "Europe/Berlin",
  "Europe/London",
  "Asia/Seoul",
  "Asia/Singapore",
  "America/Mexico_City",
] as const

const adminUserSchema = z.object({
  name: z.string().min(2, "Name is required."),
  nickname: z.string().min(2, "Nickname must be at least 2 characters.").optional().or(z.literal("")),
  givenName: z.string().min(2, "First name must be at least 2 characters.").optional().or(z.literal("")),
  familyName: z.string().min(2, "Last name must be at least 2 characters.").optional().or(z.literal("")),
  title: z.string().min(2, "Job title must be at least 2 characters.").optional().or(z.literal("")),
  department: z.string().min(2, "Department must be at least 2 characters.").optional().or(z.literal("")),
  locale: z.enum(["en-US", "de-DE", "fr-FR", "ja-JP"]),
  timezone: z.string().min(2, "Select a time zone."),
  blocked: z.boolean(),
})

type AdminUserValues = z.infer<typeof adminUserSchema>
type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

function cleanOptional(value: string | undefined) {
  if (!value) {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

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

export function UsersTable({ users: initialUsers }: { users: Auth0User[] }) {
  const [users, setUsers] = React.useState<Auth0User[]>(initialUsers)
  const [query, setQuery] = React.useState("")
  const [activeUser, setActiveUser] = React.useState<Auth0User | null>(null)

  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return users
    }
    return users.filter((user) => {
      const target = [
        user.name,
        user.email,
        user.user_id,
        user.nickname,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return target.includes(normalized)
    })
  }, [query, users])

  const updateUser = (updated: Auth0User) => {
    setUsers((current) =>
      current.map((user) =>
        user.user_id === updated.user_id ? updated : user
      )
    )
  }

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
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
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
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setActiveUser(user)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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

      <UserEditDialog
        user={activeUser}
        onClose={() => setActiveUser(null)}
        onSaved={updateUser}
      />
    </div>
  )
}

function UserEditDialog({
  user,
  onClose,
  onSaved,
}: {
  user: Auth0User | null
  onClose: () => void
  onSaved: (user: Auth0User) => void
}) {
  const [status, setStatus] = React.useState<"idle" | "saving">("idle")
  const [error, setError] = React.useState<string | null>(null)

  const metadata = user?.user_metadata ?? {}

  const localeValue =
    localeOptions.find((option) => option.value === metadata.locale)?.value ??
    "en-US"
  const timezoneValue = timezoneOptions.includes(
    metadata.timezone as (typeof timezoneOptions)[number]
  )
    ? (metadata.timezone as (typeof timezoneOptions)[number])
    : "UTC"

  const form = useForm<AdminUserValues>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: {
      name: user?.name ?? "",
      nickname: user?.nickname ?? "",
      givenName: user?.given_name ?? "",
      familyName: user?.family_name ?? "",
      title: metadata.title ?? "",
      department: metadata.department ?? "",
      locale: localeValue,
      timezone: timezoneValue,
      blocked: user?.blocked ?? false,
    },
    mode: "onBlur",
  })

  React.useEffect(() => {
    if (!user) {
      return
    }

    const nextValues: AdminUserValues = {
      name: user.name ?? "",
      nickname: user.nickname ?? "",
      givenName: user.given_name ?? "",
      familyName: user.family_name ?? "",
      title: user.user_metadata?.title ?? "",
      department: user.user_metadata?.department ?? "",
      locale:
        localeOptions.find((option) => option.value === user.user_metadata?.locale)
          ?.value ?? "en-US",
      timezone: timezoneOptions.includes(
        user.user_metadata?.timezone as (typeof timezoneOptions)[number]
      )
        ? (user.user_metadata?.timezone as (typeof timezoneOptions)[number])
        : "UTC",
      blocked: user.blocked ?? false,
    }

    form.reset(nextValues)
    setError(null)
  }, [user, form])

  const onSubmit = async (values: AdminUserValues) => {
    if (!user) {
      return
    }

    setStatus("saving")
    setError(null)

    const payload = {
      name: values.name,
      nickname: cleanOptional(values.nickname),
      given_name: cleanOptional(values.givenName),
      family_name: cleanOptional(values.familyName),
      blocked: values.blocked,
      user_metadata: {
        title: cleanOptional(values.title),
        department: cleanOptional(values.department),
        locale: values.locale,
        timezone: values.timezone,
      },
    }

    try {
      const response = await fetch(
        `/api/management/users/${encodeURIComponent(user.user_id)}`,
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to update user.")
      }

      const data = (await response.json()) as { user: Auth0User }
      onSaved(data.user)
      setStatus("idle")
      onClose()
    } catch (err) {
      setStatus("idle")
      setError(err instanceof Error ? err.message : "Update failed.")
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update user profile</DialogTitle>
          <DialogDescription>
            Edit identity metadata and access state for this user.
          </DialogDescription>
        </DialogHeader>
        {!user ? null : (
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-3 rounded-none border border-border px-3 py-2">
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
              <Badge variant="outline">
                <HugeiconsIcon icon={UserCircle02Icon} strokeWidth={2} />
                {roleLabel(user)}
              </Badge>
            </div>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="admin-name">Full name</FieldLabel>
                  <Input
                    id="admin-name"
                    aria-invalid={!!form.formState.errors.name}
                    {...form.register("name")}
                  />
                  <FieldError errors={[form.formState.errors.name]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="admin-email">Email</FieldLabel>
                  <Input
                    id="admin-email"
                    type="email"
                    defaultValue={user.email ?? ""}
                    disabled
                  />
                  <FieldDescription>Email updates are disabled.</FieldDescription>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="admin-given-name">First name</FieldLabel>
                  <Input
                    id="admin-given-name"
                    aria-invalid={!!form.formState.errors.givenName}
                    {...form.register("givenName")}
                  />
                  <FieldError errors={[form.formState.errors.givenName]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="admin-family-name">Last name</FieldLabel>
                  <Input
                    id="admin-family-name"
                    aria-invalid={!!form.formState.errors.familyName}
                    {...form.register("familyName")}
                  />
                  <FieldError errors={[form.formState.errors.familyName]} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="admin-nickname">Nickname</FieldLabel>
                <Input
                  id="admin-nickname"
                  aria-invalid={!!form.formState.errors.nickname}
                  {...form.register("nickname")}
                />
                <FieldError errors={[form.formState.errors.nickname]} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="admin-title">Job title</FieldLabel>
                  <Input
                    id="admin-title"
                    aria-invalid={!!form.formState.errors.title}
                    {...form.register("title")}
                  />
                  <FieldError errors={[form.formState.errors.title]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="admin-department">Department</FieldLabel>
                  <Input
                    id="admin-department"
                    aria-invalid={!!form.formState.errors.department}
                    {...form.register("department")}
                  />
                  <FieldError errors={[form.formState.errors.department]} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="admin-locale">Locale</FieldLabel>
                  <Controller
                    control={form.control}
                    name="locale"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="admin-locale"
                          className="w-full"
                          aria-invalid={!!form.formState.errors.locale}
                        >
                          <SelectValue placeholder="Select locale" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {localeOptions.map((locale) => (
                              <SelectItem
                                key={locale.value}
                                value={locale.value}
                              >
                                {locale.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="admin-timezone">Time zone</FieldLabel>
                  <Controller
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="admin-timezone"
                          className="w-full"
                          aria-invalid={!!form.formState.errors.timezone}
                        >
                          <SelectValue placeholder="Select time zone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {timezoneOptions.map((timezone) => (
                              <SelectItem key={timezone} value={timezone}>
                                {timezone}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={[form.formState.errors.timezone]} />
                </Field>
              </div>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="admin-blocked">Block user login</FieldLabel>
                <Controller
                  control={form.control}
                  name="blocked"
                  render={({ field }) => (
                    <Switch
                      id="admin-blocked"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </Field>
              <FieldDescription>
                Blocked users cannot authenticate through Auth0.
              </FieldDescription>
            </FieldGroup>
            {error ? (
              <div className="text-destructive text-xs" role="alert">
                {error}
              </div>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={status === "saving"}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={status === "saving"}>
                {status === "saving" ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
