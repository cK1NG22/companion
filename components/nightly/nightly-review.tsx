"use client";

import { useState, useTransition } from "react";
import { differenceInMinutes, format, parseISO } from "date-fns";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GoalIcon } from "@/components/common/goal-icon";
import { confirmHoursAction, saveNightlyAction } from "@/lib/actions/rhythm";
import type { CalendarBlock, IconKey, NightlyEntry } from "@/lib/types";

/**
 * The five questions, in this order. LOCKED (PRD §4.9) — unlike Morning
 * Review's sections, these are not user-reorderable.
 */
const QUESTIONS = [
  { key: "gratitude", label: "What am I grateful for?" },
  { key: "whatHappened", label: "What happened today?" },
  { key: "repentAndImprove", label: "How can I repent and improve?" },
  { key: "prepareForTomorrow", label: "How will I prepare for tomorrow?" },
] as const;

type AnswerKey = (typeof QUESTIONS)[number]["key"];

export function NightlyReview({
  entry,
  blocks,
  goalIcons,
}: {
  entry: NightlyEntry | null;
  blocks: CalendarBlock[];
  goalIcons: Record<string, IconKey | null>;
}) {
  const [answers, setAnswers] = useState<Record<AnswerKey, string>>({
    gratitude: entry?.gratitude ?? "",
    whatHappened: entry?.whatHappened ?? "",
    repentAndImprove: entry?.repentAndImprove ?? "",
    prepareForTomorrow: entry?.prepareForTomorrow ?? "",
  });
  const [topThree, setTopThree] = useState<string[]>([
    entry?.topThree[0] ?? "",
    entry?.topThree[1] ?? "",
    entry?.topThree[2] ?? "",
  ]);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await saveNightlyAction({ ...answers, topThree });
      toast.success(
        "Saved. It appends to the journal doc once Google is wired.",
      );
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="grid gap-4">
        <Card className="gap-0 p-0 shadow-card">
          <div className="border-b px-5 py-4">
            <h2 className="text-base font-semibold">Account for the day</h2>
            <p className="text-xs text-muted-foreground">
              The answers append to the journal doc.
            </p>
          </div>
          <div className="grid gap-4 px-5 py-4">
            {QUESTIONS.map((q, i) => (
              <div key={q.key} className="grid gap-1.5">
                <Label htmlFor={q.key} className="text-sm">
                  <span className="mr-1.5 text-muted-foreground tabular-nums">
                    {i + 1}.
                  </span>
                  {q.label}
                </Label>
                <Textarea
                  id={q.key}
                  rows={3}
                  value={answers[q.key]}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [q.key]: e.target.value }))
                  }
                  className="prose-devotional text-[15px]"
                />
              </div>
            ))}

            <div className="grid gap-1.5">
              <Label className="text-sm">
                <span className="mr-1.5 text-muted-foreground tabular-nums">
                  5.
                </span>
                Top 3 for tomorrow
              </Label>
              <p className="-mt-1 text-xs text-muted-foreground">
                Decided tonight, surfaced in tomorrow&apos;s Plan Today.
              </p>
              {topThree.map((value, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                    {i + 1}
                  </span>
                  <Input
                    value={value}
                    aria-label={`Top 3 item ${i + 1}`}
                    onChange={(e) =>
                      setTopThree((t) =>
                        t.map((v, j) => (j === i ? e.target.value : v)),
                      )
                    }
                    className="h-8"
                  />
                </div>
              ))}
            </div>

            <Button onClick={save} disabled={pending}>
              <Save className="size-4" /> Save tonight&apos;s entry
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmHoursCard blocks={blocks} goalIcons={goalIcons} />
    </div>
  );
}

/**
 * Minutes as typed. Returns null for anything that is not a non-negative
 * whole number — `Number("") || 0` and `Number("abc") || 0` would both coerce
 * to 0 and silently erase real logged time from the Home rollups.
 */
function parseMinutes(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isInteger(n) && n >= 0 && n <= 1440 ? n : null;
}

/**
 * "Confirm & log hours" (PRD §4.9). Adjust today's blocks to match reality,
 * then one button writes the actual durations into Done.
 */
function ConfirmHoursCard({
  blocks,
  goalIcons,
}: {
  blocks: CalendarBlock[];
  goalIcons: Record<string, IconKey | null>;
}) {
  const planned = (b: CalendarBlock) =>
    differenceInMinutes(parseISO(b.end), parseISO(b.start));

  const [minutes, setMinutes] = useState<Record<string, string>>(
    Object.fromEntries(
      blocks.map((b) => [b.id, String(b.confirmedMinutes ?? planned(b))]),
    ),
  );
  const [pending, startTransition] = useTransition();

  const parsed = blocks.map((b) => ({
    block: b,
    minutes: parseMinutes(minutes[b.id] ?? ""),
  }));
  const invalid = parsed.filter((p) => p.minutes === null);
  const totalHours = parsed.reduce((sum, p) => sum + (p.minutes ?? 0), 0) / 60;

  function confirm() {
    if (invalid.length > 0) {
      toast.error(
        `Check the minutes for ${invalid[0].block.name} — whole minutes only.`,
      );
      return;
    }
    startTransition(async () => {
      await confirmHoursAction({
        entries: parsed.map((p) => ({
          blockId: p.block.id,
          minutes: p.minutes as number,
        })),
      });
      toast.success("Hours logged. Home now shows them as done.");
    });
  }

  return (
    <Card className="h-fit gap-0 p-0 shadow-card">
      <div className="border-b px-5 py-4">
        <h2 className="text-base font-semibold">Confirm today&apos;s time</h2>
        <p className="text-xs text-muted-foreground">
          Adjust anything that didn&apos;t go to plan, then log it.
        </p>
      </div>

      <ul className="divide-y">
        {blocks.map((b) => (
          <li key={b.id} className="flex items-center gap-3 px-5 py-2">
            <GoalIcon
              icon={b.goalId ? goalIcons[b.goalId] : null}
              className="text-muted-foreground"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{b.name}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {format(parseISO(b.start), "h:mm a")} · planned {planned(b)} min
              </p>
            </div>
            <Input
              value={minutes[b.id] ?? ""}
              onChange={(e) =>
                setMinutes((m) => ({ ...m, [b.id]: e.target.value }))
              }
              inputMode="numeric"
              aria-label={`Actual minutes for ${b.name}`}
              aria-invalid={parseMinutes(minutes[b.id] ?? "") === null}
              className="h-8 w-16 shrink-0 text-sm tabular-nums aria-invalid:border-warm"
            />
          </li>
        ))}
        {blocks.length === 0 ? (
          <li className="px-5 py-6 text-center text-sm text-muted-foreground">
            Nothing on the calendar today.
          </li>
        ) : null}
      </ul>

      <div className="flex items-center gap-3 border-t bg-muted/40 px-5 py-3">
        <span className="text-sm text-muted-foreground">
          Total{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {totalHours.toFixed(1)}h
          </span>
        </span>
        <Button
          className="ml-auto"
          onClick={confirm}
          disabled={pending || blocks.length === 0 || invalid.length > 0}
        >
          <Check className="size-4" /> Confirm &amp; log hours
        </Button>
      </div>
    </Card>
  );
}
