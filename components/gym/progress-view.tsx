"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Exercise, MuscleFatigue, OneRepMaxPoint } from "@/lib/types";

const chartConfig = {
  estimate: { label: "Est. 1RM", color: "var(--chart-1)" },
} satisfies ChartConfig;

/**
 * Progress over time (PRD §4.6): per-lift estimated 1RM, and per-muscle
 * fatigue. Fatigue is what Bumstead reads to decide what to push tomorrow.
 */
export function ProgressView({
  exercises,
  trends,
  fatigue,
}: {
  exercises: Exercise[];
  trends: Record<string, OneRepMaxPoint[]>;
  fatigue: MuscleFatigue[];
}) {
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? "");
  const points = trends[exerciseId] ?? [];

  const data = points.map((p) => ({
    date: format(parseISO(p.date), "MMM d"),
    estimate: p.estimate,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <Card className="gap-0 p-0 shadow-card">
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold">Estimated 1RM over time</h2>
            <p className="text-xs text-muted-foreground">
              Averaged Epley and Brzycki from every logged set
            </p>
          </div>
          <Select
            value={exerciseId}
            onValueChange={(v) => v && setExerciseId(v)}
          >
            <SelectTrigger className="h-8 w-[190px]" aria-label="Choose a lift">
              {/* Base UI renders the raw value unless given a render fn. */}
              <SelectValue>
                {(v) => exercises.find((e) => e.id === v)?.name ?? ""}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {exercises.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="px-2 py-4">
          {data.length < 2 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Log a few more sessions and the trend shows up here.
            </p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={11}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={38}
                  fontSize={11}
                  domain={["dataMin - 10", "dataMax + 10"]}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  dataKey="estimate"
                  type="monotone"
                  stroke="var(--color-estimate)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>
      </Card>

      <Card className="gap-0 p-0 shadow-card">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Fatigue by muscle group</h2>
          <p className="text-xs text-muted-foreground">
            Recent volume against days of rest
          </p>
        </div>
        <ul className="divide-y">
          {fatigue.map((f) => (
            <li key={f.muscleGroup} className="grid gap-1.5 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm capitalize">
                  {f.muscleGroup}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {f.recentVolume.toLocaleString()} lb · {f.daysRest}d rest
                </span>
              </div>
              {/* A plain bar, not a chart — one value, no axes needed. */}
              <div className="h-1.5 overflow-hidden rounded-[3px] bg-secondary">
                <span
                  className={cn(
                    "block h-full rounded-[3px]",
                    f.score > 0.6 ? "bg-warm" : "bg-primary",
                  )}
                  style={{ width: `${Math.round(f.score * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="border-t bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
          Bumstead reads this to pick tomorrow — push what is fresh, leave what
          is hammered.
        </p>
      </Card>
    </div>
  );
}
