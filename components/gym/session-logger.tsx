"use client";

import { useState, useTransition } from "react";
import { Plus, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteSetAction, logSetAction } from "@/lib/actions/gym";
import type { SessionExercise } from "@/lib/data/gym";

/**
 * Today's session (PRD §4.6). Bumstead suggests the target; Carter logs the
 * actuals. The gap between the two is what the calibration loop feeds on.
 */
export function SessionLogger({ session }: { session: SessionExercise[] }) {
  return (
    <div className="grid gap-3">
      {session.map((item) => (
        <ExerciseCard key={item.exercise.id} item={item} />
      ))}
    </div>
  );
}

function ExerciseCard({ item }: { item: SessionExercise }) {
  const { exercise, sets, bestOneRepMax } = item;
  const [weight, setWeight] = useState(String(exercise.suggestedWeight ?? ""));
  const [reps, setReps] = useState(String(exercise.suggestedReps ?? ""));
  const [pending, startTransition] = useTransition();

  const target =
    exercise.suggestedWeight && exercise.suggestedReps
      ? `${exercise.suggestedSets ?? 3} × ${exercise.suggestedReps} @ ${exercise.suggestedWeight} lb`
      : "—";

  function log() {
    startTransition(async () => {
      const result = await logSetAction({
        exerciseId: exercise.id,
        weight: Number(weight),
        reps: Number(reps),
      });
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <Card className="gap-0 p-0 shadow-card">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{exercise.name}</h2>
          <p className="text-xs text-muted-foreground">
            Bumstead suggests {target}
          </p>
        </div>
        {bestOneRepMax > 0 ? (
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            est. 1RM{" "}
            <span className="font-semibold text-foreground">
              {bestOneRepMax}
            </span>{" "}
            lb
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        {sets.map((s) => (
          <span
            key={s.id}
            className="group inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs tabular-nums"
          >
            {s.isPr ? <Trophy className="size-3 text-warm" /> : null}
            {s.weight} × {s.reps}
            <button
              type="button"
              aria-label={`Remove ${s.weight} by ${s.reps} set`}
              onClick={() => startTransition(() => deleteSetAction(s.id))}
              className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        {sets.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            No sets logged yet today.
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2 border-t bg-muted/40 px-4 py-2.5">
        <Input
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          inputMode="numeric"
          aria-label={`Weight for ${exercise.name}`}
          className="h-8 w-20 text-sm tabular-nums"
        />
        <span className="text-xs text-muted-foreground">lb ×</span>
        <Input
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          inputMode="numeric"
          aria-label={`Reps for ${exercise.name}`}
          className="h-8 w-16 text-sm tabular-nums"
        />
        <span className="text-xs text-muted-foreground">reps</span>
        <Button
          size="sm"
          className="ml-auto"
          disabled={pending || !weight || !reps}
          onClick={log}
        >
          <Plus className="size-3.5" /> Log set
        </Button>
      </div>

      {sets.some((s) => s.isPr) ? (
        <div className="border-t bg-warm-soft px-4 py-1.5">
          <Badge className="bg-warm text-[10px] text-background">
            PR today — new estimated max
          </Badge>
        </div>
      ) : null}
    </Card>
  );
}
