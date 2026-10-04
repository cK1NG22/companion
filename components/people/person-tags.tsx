"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addTagAction, removeTagAction } from "@/lib/actions/people";
import { TAG_NAME_MAX, normalizeTagName, tagsOf } from "@/lib/tags";
import type { Person, Tag } from "@/lib/types";

/**
 * One person's tags (PRD §4.4): a chip per tag with a remove button, then an
 * add button. Every control is 24px square so neighbours stay tappable.
 */
export function PersonTags({
  person,
  allTags,
}: {
  person: Person;
  allTags: Tag[];
}) {
  const [, startTransition] = useTransition();
  const tags = tagsOf(person, allTags);

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex h-6 max-w-full items-center rounded-full bg-secondary pl-2 text-xs text-secondary-foreground"
        >
          <span className="truncate">{tag.name}</span>
          <button
            type="button"
            aria-label={`Remove tag ${tag.name} from ${person.name}`}
            onClick={() =>
              startTransition(() =>
                removeTagAction({ personId: person.id, tagId: tag.id }),
              )
            }
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
      <AddTag person={person} allTags={allTags} />
    </div>
  );
}

function AddTag({ person, allTags }: { person: Person; allTags: Tag[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const available = allTags.filter((t) => !person.tags.includes(t.id));

  const add = (tag: { tagId: string } | { name: string }) =>
    startTransition(async () => {
      const result = await addTagAction({ personId: person.id, ...tag });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setName("");
      setOpen(false);
    });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (normalizeTagName(name) !== null) add({ name });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Add tag to ${person.name}`}
            className="rounded-full text-muted-foreground"
          />
        }
      >
        <Plus aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <PopoverTitle>Tag {person.name}</PopoverTitle>
        {available.length > 0 ? (
          <ul className="flex flex-wrap gap-1">
            {available.map((tag) => (
              <li key={tag.id}>
                <Button
                  variant="secondary"
                  size="xs"
                  disabled={pending}
                  onClick={() => add({ tagId: tag.id })}
                  className="rounded-full"
                >
                  {tag.name}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <form onSubmit={onSubmit} className="flex gap-1.5">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={TAG_NAME_MAX}
            placeholder="New tag…"
            aria-label="New tag name"
            className="h-8"
          />
          <Button
            type="submit"
            size="sm"
            className="h-8"
            disabled={pending || normalizeTagName(name) === null}
          >
            Create
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
