"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  addQuestionAction,
  addScriptureNoteAction,
  toggleQuestionAction,
} from "@/lib/actions/scripture";
import type { CarriedQuestion, Reading, ScriptureNote } from "@/lib/types";

/**
 * Scripture study (PRD §4.5). Body text is Georgia — one of the only two
 * places serif is allowed (the other is the journal).
 */
export function ScriptureView({
  notes,
  questions,
  readings,
  monthlyGoal,
}: {
  notes: ScriptureNote[];
  questions: CarriedQuestion[];
  readings: Reading[];
  monthlyGoal: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="grid gap-4">
        <NoteComposer />
        <Card className="gap-0 p-0 shadow-card">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Study notes</h2>
          </div>
          <ul className="divide-y">
            {notes.map((note) => (
              <li key={note.id} className="px-5 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold">{note.reference}</h3>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {format(parseISO(note.date), "MMM d")}
                  </span>
                </div>
                <p className="prose-devotional mt-1.5 text-[15px] text-muted-foreground">
                  {note.body}
                </p>
              </li>
            ))}
            {notes.length === 0 ? (
              <li className="px-5 py-6 text-center text-sm text-muted-foreground">
                No notes yet.
              </li>
            ) : null}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card className="gap-2 px-5 py-4 shadow-card">
          <h2 className="text-sm font-semibold">This month&apos;s study goal</h2>
          <p className="prose-devotional text-[15px] text-muted-foreground">
            {monthlyGoal}
          </p>
        </Card>

        <QuestionsCard questions={questions} />

        <Card className="gap-0 p-0 shadow-card">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Currently reading</h2>
          </div>
          <ul className="divide-y">
            {readings.map((r) => (
              <li key={r.id} className="grid gap-1.5 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {r.title}
                  </span>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {r.type}
                  </Badge>
                </div>
                {/* A single value, so shadcn's Progress is the right control
                    here — unlike the KI tiles, which need three. The title is
                    a sibling node, so without aria-label a screen reader
                    announces a bare percentage with nothing to attach it to. */}
                <Progress
                  value={r.percent}
                  className="h-1.5"
                  aria-label={`${r.title} reading progress`}
                />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {r.progress}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function NoteComposer() {
  const [reference, setReference] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      const result = await addScriptureNoteAction({ reference, body });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setReference("");
      setBody("");
    });
  }

  return (
    <Card className="gap-2 px-5 py-4 shadow-card">
      <Input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="Passage — e.g. Alma 32:27"
        className="h-8"
      />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="What stood out, and what it asks of me…"
        className="prose-devotional text-[15px]"
      />
      <Button
        className="justify-self-start"
        size="sm"
        disabled={pending || !reference.trim() || !body.trim()}
        onClick={add}
      >
        <Plus className="size-3.5" /> Add note
      </Button>
    </Card>
  );
}

function QuestionsCard({ questions }: { questions: CarriedQuestion[] }) {
  const [text, setText] = useState("");
  const [, startTransition] = useTransition();

  return (
    <Card className="gap-0 p-0 shadow-card">
      <div className="border-b px-5 py-3">
        <h2 className="text-sm font-semibold">Questions I&apos;m carrying</h2>
        <p className="text-xs text-muted-foreground">
          Hold these while you read.
        </p>
      </div>
      <ul className="divide-y">
        {questions.map((q) => (
          <li key={q.id} className="flex items-start gap-2.5 px-5 py-2.5">
            <Checkbox
              checked={q.resolved}
              onCheckedChange={() =>
                startTransition(() => toggleQuestionAction(q.id))
              }
              aria-label={q.text}
              className="mt-0.5"
            />
            <span
              className={cn(
                "text-sm leading-snug",
                q.resolved && "text-muted-foreground line-through",
              )}
            >
              {q.text}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 border-t bg-muted/40 px-5 py-2.5">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || !text.trim()) return;
            const value = text;
            setText("");
            startTransition(() => addQuestionAction(value));
          }}
          placeholder="A new question…"
          className="h-8 text-sm"
        />
      </div>
    </Card>
  );
}
