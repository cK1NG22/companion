"use client";

import { useMemo, useState, useTransition } from "react";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import {
  CalendarDays,
  Mail,
  MessageSquare,
  RefreshCw,
  Rows3,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { refreshContactsAction, setExcludedAction } from "@/lib/actions/people";
import { filterByTag, groupByTag } from "@/lib/tags";
import type { ContactChannel, Person, Tag } from "@/lib/types";
import { PersonTags } from "./person-tags";

const CHANNEL_ICON = {
  email: Mail,
  text: MessageSquare,
  calendar: CalendarDays,
} as const;

const CHANNEL_LABEL: Record<ContactChannel, string> = {
  email: "last email",
  text: "last text",
  calendar: "last meeting",
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/**
 * Keep-in-touch (PRD §4.4). Sorted by staleness — days since the freshest of
 * email / text / calendar. The text signal comes from the local Mac agent,
 * which reads handle + timestamp only and never message bodies.
 *
 * Tags filter and group the list. Neither reorders it: inside a tag, as in the
 * default view, people stay stale-first in the order `getPeople` gave them.
 */
export function PeopleList({
  people,
  allPeople,
  tags,
  lastSyncedAt,
}: {
  /** Default list — excluded people are already filtered out. */
  people: Person[];
  /** Everyone, including excluded, so search can toggle someone back on. */
  allPeople: Person[];
  /** Every tag, in sort order. */
  tags: Tag[];
  lastSyncedAt: string;
}) {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [grouped, setGrouped] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Searching widens the pool to everyone; the resting list does not.
    const pool = q
      ? allPeople.filter((p) => p.name.toLowerCase().includes(q))
      : people;
    return filterByTag(pool, tagFilter);
  }, [people, allPeople, query, tagFilter]);

  const filterName = tags.find((t) => t.id === tagFilter)?.name;
  const emptyMessage = query.trim()
    ? `No one matches “${query}”${filterName ? ` in ${filterName}` : ""}.`
    : filterName
      ? `No one is tagged ${filterName}.`
      : "No one here yet.";

  const synced = formatDistanceToNowStrict(parseISO(lastSyncedAt), {
    addSuffix: true,
  });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts…"
            aria-label="Search contacts"
            className="h-9 pl-8"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await refreshContactsAction();
              toast.success(
                "Queued — the Mac agent runs it next time it's on.",
              );
            })
          }
        >
          <RefreshCw className={cn("size-3.5", pending && "animate-spin")} />
          Refresh signals
        </Button>
        <span className="text-xs text-muted-foreground">synced {synced}</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div
          role="group"
          aria-label="Filter by tag"
          className="flex flex-wrap items-center gap-1.5"
        >
          <FilterChip
            label="All"
            pressed={tagFilter === null}
            onClick={() => setTagFilter(null)}
          />
          {tags.map((tag) => (
            <FilterChip
              key={tag.id}
              label={tag.name}
              pressed={tagFilter === tag.id}
              onClick={() => setTagFilter(tag.id)}
            />
          ))}
        </div>
        <Button
          variant={grouped ? "default" : "outline"}
          size="sm"
          aria-pressed={grouped}
          onClick={() => setGrouped((g) => !g)}
          className="ml-auto"
        >
          <Rows3 />
          Group by tag
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="gap-0 p-0 shadow-card">
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        </Card>
      ) : grouped ? (
        groupByTag(filtered, tags).map(({ tag, people: members }) => {
          const headingId = `people-group-${tag?.id ?? "untagged"}`;
          return (
            <section
              key={headingId}
              aria-labelledby={headingId}
              className="grid gap-2"
            >
              <h2 id={headingId} className="text-sm font-medium">
                {tag?.name ?? "No tag"}
              </h2>
              <PeopleCard people={members} tags={tags} />
            </section>
          );
        })
      ) : (
        <PeopleCard people={filtered} tags={tags} />
      )}

      <p className="text-xs text-muted-foreground">
        Excluded people are hidden here and skipped by the scan entirely — their
        handles are never queried.
      </p>
    </div>
  );
}

function FilterChip({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={pressed ? "default" : "outline"}
      size="xs"
      aria-pressed={pressed}
      onClick={onClick}
      className="rounded-full"
    >
      {label}
    </Button>
  );
}

function PeopleCard({ people, tags }: { people: Person[]; tags: Tag[] }) {
  return (
    <Card className="gap-0 p-0 shadow-card">
      <ul className="divide-y">
        {people.map((person) => (
          <PersonRow key={person.id} person={person} tags={tags} />
        ))}
      </ul>
    </Card>
  );
}

function PersonRow({ person, tags }: { person: Person; tags: Tag[] }) {
  const [, startTransition] = useTransition();
  const Icon = person.lastContactSource
    ? CHANNEL_ICON[person.lastContactSource]
    : null;

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="bg-secondary text-[11px]">
          {initials(person.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{person.name}</p>
          {person.overdue ? (
            <Badge
              variant="secondary"
              className="shrink-0 bg-warm-soft text-[10px] text-warm"
            >
              overdue
            </Badge>
          ) : null}
        </div>
        {person.relationship ? (
          <p className="truncate text-xs text-muted-foreground">
            {person.relationship}
          </p>
        ) : null}
        {person.nextStep ? (
          <p className="mt-0.5 truncate text-xs">{person.nextStep}</p>
        ) : null}
        <PersonTags person={person} allTags={tags} />
      </div>

      <div className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        {Icon ? <Icon className="size-3.5" /> : null}
        <span>
          {person.lastContactSource
            ? CHANNEL_LABEL[person.lastContactSource]
            : "no signal"}
        </span>
      </div>

      <span
        className={cn(
          "w-12 shrink-0 text-right text-sm tabular-nums",
          person.overdue ? "font-medium text-warm" : "text-muted-foreground",
        )}
      >
        {person.daysSinceContact === null
          ? "never"
          : `${person.daysSinceContact}d`}
      </span>

      <Switch
        checked={!person.excluded}
        aria-label={`Include ${person.name}`}
        onCheckedChange={(checked) =>
          startTransition(() =>
            setExcludedAction({ id: person.id, excluded: !checked }),
          )
        }
        className="shrink-0"
      />
    </li>
  );
}
