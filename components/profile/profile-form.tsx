"use client"

import * as React from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import type { Auth0User } from "@/lib/auth0-types"
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
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

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

const profileSchema = z.object({
  name: z.string().min(2, "Name is required."),
  nickname: z.string().min(2, "Nickname must be at least 2 characters.").optional().or(z.literal("")),
  givenName: z.string().min(2, "First name must be at least 2 characters.").optional().or(z.literal("")),
  familyName: z.string().min(2, "Last name must be at least 2 characters.").optional().or(z.literal("")),
  title: z.string().min(2, "Job title must be at least 2 characters.").optional().or(z.literal("")),
  department: z.string().min(2, "Department must be at least 2 characters.").optional().or(z.literal("")),
  locale: z.enum(["en-US", "de-DE", "fr-FR", "ja-JP"]),
  timezone: z.string().min(2, "Select a time zone."),
  bio: z.string().max(160, "Bio must be 160 characters or less.").optional().or(z.literal("")),
})

type ProfileValues = z.infer<typeof profileSchema>

function cleanOptional(value: string | undefined) {
  if (!value) {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

export function ProfileForm({ user }: { user: Auth0User }) {
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved">(
    "idle"
  )
  const [error, setError] = React.useState<string | null>(null)
  const [lastSaved, setLastSaved] = React.useState<string | null>(null)

  const metadata = user.user_metadata ?? {}

  const localeValue =
    localeOptions.find((option) => option.value === metadata.locale)?.value ??
    "en-US"
  const timezoneValue = timezoneOptions.includes(
    metadata.timezone as (typeof timezoneOptions)[number]
  )
    ? (metadata.timezone as (typeof timezoneOptions)[number])
    : "UTC"

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name ?? "",
      nickname: user.nickname ?? "",
      givenName: user.given_name ?? "",
      familyName: user.family_name ?? "",
      title: metadata.title ?? "",
      department: metadata.department ?? "",
      locale: localeValue,
      timezone: timezoneValue,
      bio: metadata.bio ?? "",
    },
    mode: "onBlur",
  })

  const onSubmit = async (values: ProfileValues) => {
    setStatus("saving")
    setError(null)

    const payload = {
      name: values.name,
      nickname: cleanOptional(values.nickname),
      given_name: cleanOptional(values.givenName),
      family_name: cleanOptional(values.familyName),
      user_metadata: {
        title: cleanOptional(values.title),
        department: cleanOptional(values.department),
        locale: values.locale,
        timezone: values.timezone,
        bio: cleanOptional(values.bio),
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
        throw new Error(body.error ?? "Failed to update profile.")
      }

      const now = new Date()
      setLastSaved(
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      )
      setStatus("saved")
      form.reset(values)
    } catch (err) {
      setStatus("idle")
      setError(err instanceof Error ? err.message : "Update failed.")
    }
  }

  return (
    <Card>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <CardHeader className="border-b">
          <CardTitle>Profile editor</CardTitle>
          <CardDescription>
            Update your Auth0 profile data and shared metadata fields.
          </CardDescription>
          <CardAction>
            <Badge variant={form.formState.isDirty ? "secondary" : "outline"}>
              {form.formState.isDirty ? "Draft" : "Synced"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="profile-name">Full name</FieldLabel>
                <Input
                  id="profile-name"
                  placeholder="Full name"
                  aria-invalid={!!form.formState.errors.name}
                  {...form.register("name")}
                />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                <Input
                  id="profile-email"
                  type="email"
                  placeholder="name@company.com"
                  defaultValue={user.email ?? ""}
                  disabled
                />
                <FieldDescription>Email updates are disabled.</FieldDescription>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="profile-given-name">First name</FieldLabel>
                <Input
                  id="profile-given-name"
                  placeholder="First name"
                  aria-invalid={!!form.formState.errors.givenName}
                  {...form.register("givenName")}
                />
                <FieldError errors={[form.formState.errors.givenName]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="profile-family-name">Last name</FieldLabel>
                <Input
                  id="profile-family-name"
                  placeholder="Last name"
                  aria-invalid={!!form.formState.errors.familyName}
                  {...form.register("familyName")}
                />
                <FieldError errors={[form.formState.errors.familyName]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="profile-nickname">Nickname</FieldLabel>
              <Input
                id="profile-nickname"
                placeholder="Nickname"
                aria-invalid={!!form.formState.errors.nickname}
                {...form.register("nickname")}
              />
              <FieldError errors={[form.formState.errors.nickname]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
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
              <Field>
                <FieldLabel htmlFor="profile-department">Department</FieldLabel>
                <Input
                  id="profile-department"
                  placeholder="Department"
                  aria-invalid={!!form.formState.errors.department}
                  {...form.register("department")}
                />
                <FieldError errors={[form.formState.errors.department]} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
              <FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
              <Textarea
                id="profile-bio"
                rows={3}
                placeholder="Short internal summary"
                aria-invalid={!!form.formState.errors.bio}
                {...form.register("bio")}
              />
              <FieldDescription>Max 160 characters.</FieldDescription>
              <FieldError errors={[form.formState.errors.bio]} />
            </Field>
          </FieldGroup>
          {error ? (
            <div className="text-destructive text-xs" role="alert">
              {error}
            </div>
          ) : null}
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
              disabled={status === "saving"}
            >
              Reset
            </Button>
            <Button type="submit" size="sm" disabled={status === "saving"}>
              {status === "saving" ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
