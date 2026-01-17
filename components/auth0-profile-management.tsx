"use client"

import * as React from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LanguageCircleIcon,
  MailIcon,
  NotificationIcon,
  PlusSignIcon,
  SearchIcon,
  ShieldIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"

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
  DialogTrigger,
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
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

const pageStyles = {
  "--page-surface": "oklch(0.98 0.02 95)",
  "--page-ink": "oklch(0.18 0.02 255)",
  "--page-accent": "oklch(0.72 0.12 165)",
  "--page-accent-strong": "oklch(0.58 0.14 158)",
  "--page-glow": "oklch(0.92 0.06 160)",
} as React.CSSProperties

const users = [
  {
    id: "usr_01",
    name: "Amina Rao",
    email: "amina.rao@northwind.io",
    role: "Admin",
    status: "Active",
    lastLogin: "2h ago",
    mfa: true,
    provider: "auth0",
    location: "Berlin",
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "usr_02",
    name: "Tomas Ivers",
    email: "tomas.ivers@northwind.io",
    role: "Manager",
    status: "Active",
    lastLogin: "1d ago",
    mfa: false,
    provider: "google-oauth2",
    location: "London",
    avatar: "",
  },
  {
    id: "usr_03",
    name: "Helena Cho",
    email: "helena.cho@northwind.io",
    role: "Analyst",
    status: "Invited",
    lastLogin: "Pending",
    mfa: false,
    provider: "github",
    location: "Seoul",
    avatar: "",
  },
  {
    id: "usr_04",
    name: "Mateo Diaz",
    email: "mateo.diaz@northwind.io",
    role: "Viewer",
    status: "Suspended",
    lastLogin: "12d ago",
    mfa: true,
    provider: "auth0",
    location: "Mexico City",
    avatar: "",
  },
  {
    id: "usr_05",
    name: "Priya Menon",
    email: "priya.menon@northwind.io",
    role: "Manager",
    status: "Active",
    lastLogin: "6h ago",
    mfa: true,
    provider: "azuread",
    location: "Singapore",
    avatar: "",
  },
]

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  email: z.string().email("Use a valid email address."),
  title: z.string().min(2, "Job title is required."),
  role: z.enum(["admin", "manager", "analyst", "viewer"]),
  locale: z.enum(["en-US", "de-DE", "fr-FR", "ja-JP"]),
  timezone: z.string().min(2, "Time zone is required."),
  bio: z.string().max(160, "Bio must be 160 characters or less."),
  mfaRequired: z.boolean(),
  sessionAlerts: z.boolean(),
  marketingEmails: z.boolean(),
})

type ProfileValues = z.infer<typeof profileSchema>
type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "analyst", label: "Analyst" },
  { value: "viewer", label: "Viewer" },
]

const localeOptions = [
  { value: "en-US", label: "English (US)" },
  { value: "de-DE", label: "German" },
  { value: "fr-FR", label: "French" },
  { value: "ja-JP", label: "Japanese" },
]

const timezoneOptions = [
  "UTC",
  "Europe/Berlin",
  "Europe/London",
  "Asia/Seoul",
  "Asia/Singapore",
  "America/Mexico_City",
]

function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "Active":
      return "default"
    case "Invited":
      return "secondary"
    case "Suspended":
      return "destructive"
    default:
      return "outline"
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function Auth0ProfileManagementApp() {
  const selectedUser = users[0]
  const directoryPanel = (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Directory</CardTitle>
          <CardDescription>
            Active identities across the Auth0 tenant.
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <Badge variant="outline">Realtime sync</Badge>
            <Badge variant="secondary">12 alerts</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>MFA</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        {user.avatar ? (
                          <AvatarImage src={user.avatar} alt={user.name} />
                        ) : null}
                        <AvatarFallback>{initials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium text-xs">{user.name}</div>
                        <div className="text-muted-foreground truncate text-[11px]">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastLogin}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.mfa ? "default" : "outline"}>
                      {user.mfa ? "Enabled" : "Off"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="xs">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-between">
          <div className="text-muted-foreground text-xs">
            1,284 total identities tracked.
          </div>
          <Button variant="outline" size="sm">
            Review audit log
          </Button>
        </CardFooter>
      </Card>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          label="Active users"
          value="1,128"
          detail="92% enabled"
          icon={<HugeiconsIcon icon={UserIcon} strokeWidth={2} />}
        />
        <MetricCard
          label="MFA coverage"
          value="86%"
          detail="74 enforced"
          icon={<HugeiconsIcon icon={ShieldIcon} strokeWidth={2} />}
        />
        <MetricCard
          label="Pending invites"
          value="12"
          detail="4 expiring"
          icon={<HugeiconsIcon icon={NotificationIcon} strokeWidth={2} />}
        />
      </div>
    </div>
  )

  const profilePanel = (
    <div className="grid gap-4">
      <ProfileSummary user={selectedUser} />
      <ProfileEditor user={selectedUser} />
    </div>
  )

  return (
    <div
      className="bg-[color:var(--page-surface)] text-[color:var(--page-ink)] relative min-h-screen overflow-hidden"
      style={pageStyles}
    >
      <div className="pointer-events-none absolute -top-24 right-[-8rem] h-72 w-72 rounded-full bg-[radial-gradient(circle_at_top,_var(--page-glow),_transparent_70%)] opacity-70" />
      <div className="pointer-events-none absolute left-[-6rem] top-64 h-64 w-64 rotate-6 rounded-3xl border border-black/5 bg-white/60 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.4)]" />
      <div className="pointer-events-none absolute bottom-[-12rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_top,_var(--page-accent),_transparent_70%)] opacity-45" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-[0.35em] border-[color:var(--page-accent-strong)] text-[color:var(--page-ink)]"
              >
                Auth0 tenant: northwind-prod
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold">
                  Profile Management Studio
                </h1>
                <p className="text-muted-foreground max-w-xl text-sm">
                  Curate identities, metadata, and security posture for every
                  user connected to your Auth0 domain.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm">
                Sync directory
              </Button>
              <InviteDialog />
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <InputGroup className="bg-background/80 w-full border-black/5 backdrop-blur lg:max-w-md">
              <InputGroupAddon>
                <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
              </InputGroupAddon>
              <InputGroupInput placeholder="Search users or user ID" />
            </InputGroup>
            <div className="flex flex-wrap items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger size="sm" className="w-40">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All roles</SelectItem>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select defaultValue="active">
                <SelectTrigger size="sm" className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm">
                Export view
              </Button>
            </div>
          </div>
        </header>

        <div className="lg:hidden">
          <Tabs defaultValue="directory">
            <TabsList className="w-full">
              <TabsTrigger value="directory">Directory</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>
            <TabsContent value="directory">{directoryPanel}</TabsContent>
            <TabsContent value="profile">{profilePanel}</TabsContent>
          </Tabs>
        </div>
        <div className="hidden gap-6 lg:grid lg:grid-cols-[1.15fr_0.85fr]">
          {directoryPanel}
          {profilePanel}
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string
  value: string
  detail: string
  icon: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-muted-foreground text-[11px] uppercase tracking-[0.24em]">
            {label}
          </div>
          <div className="text-lg font-semibold">{value}</div>
          <div className="text-muted-foreground text-xs">{detail}</div>
        </div>
        <div className="text-muted-foreground flex size-9 items-center justify-center rounded-full border border-black/10">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

function InviteDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">
          <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} data-icon="inline-start" />
          Invite user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a teammate</DialogTitle>
          <DialogDescription>
            Send a secure Auth0 invitation link with a pre-set role.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="invite-email">Email address</FieldLabel>
            <Input id="invite-email" placeholder="name@company.com" type="email" />
          </Field>
          <Field>
            <FieldLabel htmlFor="invite-role">Role</FieldLabel>
            <Select defaultValue="viewer">
              <SelectTrigger id="invite-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline">Save draft</Button>
          <Button>Send invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ProfileSummary({
  user,
}: {
  user: (typeof users)[number]
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Selected profile</CardTitle>
        <CardDescription>
          Identity context and linked providers for Auth0.
        </CardDescription>
        <CardAction>
          <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar size="lg">
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name} />
            ) : null}
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-muted-foreground text-xs">{user.email}</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{user.role}</Badge>
              <Badge variant="secondary">{user.location}</Badge>
            </div>
          </div>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-medium">auth0|{user.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Primary provider</span>
            <span className="font-medium">{user.provider}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Last login</span>
            <span className="font-medium">{user.lastLogin}</span>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="text-muted-foreground text-[11px] uppercase tracking-[0.2em]">
            Linked identities
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">auth0</Badge>
            <Badge variant="outline">google-oauth2</Badge>
            <Badge variant="outline">github</Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" size="sm">
          Reset password
        </Button>
        <Button variant="ghost" size="sm">
          View login history
        </Button>
      </CardFooter>
    </Card>
  )
}

function ProfileEditor({
  user,
}: {
  user: (typeof users)[number]
}) {
  const [lastSaved, setLastSaved] = React.useState<string | null>(null)
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.name,
      email: user.email,
      title: "Identity Operations Lead",
      role: "admin",
      locale: "en-US",
      timezone: "Europe/Berlin",
      bio: "Focused on clean Auth0 user metadata, policy alignment, and human-first onboarding.",
      mfaRequired: true,
      sessionAlerts: true,
      marketingEmails: false,
    },
    mode: "onBlur",
  })

  const onSubmit = (values: ProfileValues) => {
    setLastSaved(
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    )
    form.reset(values)
  }

  return (
    <Card>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <CardHeader className="border-b">
          <CardTitle>Profile editor</CardTitle>
          <CardDescription>
            Update Auth0 metadata and security preferences.
          </CardDescription>
          <CardAction>
            <Badge variant={form.formState.isDirty ? "secondary" : "outline"}>
              {form.formState.isDirty ? "Draft" : "Synced"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-[11px] uppercase tracking-[0.2em]">
              Core profile
            </div>
            <Badge variant="outline">
              <HugeiconsIcon icon={UserIcon} strokeWidth={2} data-icon="inline-start" />
              Identity
            </Badge>
          </div>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="profile-name">Full name</FieldLabel>
                <Input
                  id="profile-name"
                  placeholder="Full name"
                  aria-invalid={!!form.formState.errors.fullName}
                  {...form.register("fullName")}
                />
                <FieldError errors={[form.formState.errors.fullName]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="profile-title">Job title</FieldLabel>
                <Input
                  id="profile-title"
                  placeholder="Job title"
                  aria-invalid={!!form.formState.errors.title}
                  {...form.register("title")}
                />
                <FieldError errors={[form.formState.errors.title]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="profile-email">Email</FieldLabel>
              <Input
                id="profile-email"
                type="email"
                placeholder="name@company.com"
                aria-invalid={!!form.formState.errors.email}
                {...form.register("email")}
              />
              <FieldError errors={[form.formState.errors.email]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="profile-role">Role</FieldLabel>
                <Controller
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="profile-role" className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {roleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="profile-timezone">Time zone</FieldLabel>
                <Controller
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="profile-timezone"
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
            <Field>
              <FieldLabel htmlFor="profile-locale">Locale</FieldLabel>
              <Controller
                control={form.control}
                name="locale"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="profile-locale"
                      className="w-full"
                      aria-invalid={!!form.formState.errors.locale}
                    >
                      <SelectValue placeholder="Select locale" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {localeOptions.map((locale) => (
                          <SelectItem key={locale.value} value={locale.value}>
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
              <FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
              <Textarea
                id="profile-bio"
                placeholder="Short internal summary"
                rows={3}
                aria-invalid={!!form.formState.errors.bio}
                {...form.register("bio")}
              />
              <FieldDescription>160 character limit for Auth0.</FieldDescription>
              <FieldError errors={[form.formState.errors.bio]} />
            </Field>
          </FieldGroup>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-[11px] uppercase tracking-[0.2em]">
              Security & alerts
            </div>
            <Badge variant="outline">
              <HugeiconsIcon icon={ShieldIcon} strokeWidth={2} data-icon="inline-start" />
              Policy
            </Badge>
          </div>
          <FieldGroup>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="profile-mfa">
                Require MFA for this user
              </FieldLabel>
              <Controller
                control={form.control}
                name="mfaRequired"
                render={({ field }) => (
                  <Switch
                    id="profile-mfa"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="profile-alerts">
                Session anomaly alerts
              </FieldLabel>
              <Controller
                control={form.control}
                name="sessionAlerts"
                render={({ field }) => (
                  <Switch
                    id="profile-alerts"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="profile-marketing">
                Marketing emails
              </FieldLabel>
              <Controller
                control={form.control}
                name="marketingEmails"
                render={({ field }) => (
                  <Switch
                    id="profile-marketing"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </Field>
          </FieldGroup>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-[11px] uppercase tracking-[0.2em]">
              Notifications
            </div>
            <Badge variant="outline">
              <HugeiconsIcon icon={MailIcon} strokeWidth={2} data-icon="inline-start" />
              Messaging
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card size="sm" className="border border-black/5">
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Email cadence</span>
                  <Badge variant="secondary">Weekly</Badge>
                </div>
                <div className="text-muted-foreground text-xs">
                  Digest for login anomalies and invite status.
                </div>
              </CardContent>
            </Card>
            <Card size="sm" className="border border-black/5">
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Locale routing</span>
                  <Badge variant="outline">
                    <HugeiconsIcon icon={LanguageCircleIcon} strokeWidth={2} data-icon="inline-start" />
                    {form.watch("locale")}
                  </Badge>
                </div>
                <div className="text-muted-foreground text-xs">
                  Messages are auto-localized for the selected locale.
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <div className="text-muted-foreground text-xs">
            {lastSaved ? `Last saved at ${lastSaved}` : "No saved changes yet."}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <Button type="submit" size="sm">
              Save profile
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
