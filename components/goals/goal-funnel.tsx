"use client";

import { useState, useTransition } from "react";
import { ArrowUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GoalIcon } from "@/components/common/goal-icon";
import { IconPicker } from "@/components/goals/icon-picker";
import { createGoalAction, updateGoalAction } from "@/lib/actions/goals";
import type { Goal, GoalTier, IconKey } from "@/lib/types";

/**
 * Goals → Plans → Inputs (PRD §4.2). The three tiers mean three things:
 *   year  = who I'm becoming
 *   month = the concrete means
 *   week  = the measurable inputs, which ARE the Home tiles
 */
const TIERS: { tier: GoalTier; label: string; caption: string }[] = [
  { tier: "year", label: "Goals", caption: "Who I'm becoming · this year" },
  { tier: "month", label: "Plans", caption: "The means · this month" },
  {
    tier: "week",
    label: "Inputs",
    caption: "Measured weekly · these are the tiles",
  },
];

export function GoalFunnel({
  goals,
  parentTitles,
}: {
  goals: Record<GoalTier, Goal[]>;
  parentTitles: Record<string, string>;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          The funnel
        </h2>
        <Button
          variant={editing ? "default" : "outline"}
          size="sm"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "Done" : "Edit goals"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {TIERS.map(({ tier, label, caption }) => (
          <Card key={tier} className="gap-0 p-0 shadow-card">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-semibold">{label}</h3>
              <p className="text-xs text-muted-foreground">{caption}</p>
            </div>
            <ul className="divide-y">
              {goals[tier].map((goal) => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  editing={editing}
                  parentTitle={
                    goal.parentId ? parentTitles[goal.parentId] : undefined
                  }
                />
              ))}
            </ul>
            {editing ? <AddGoalRow tier={tier} /> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}

function GoalRow({
  goal,
  editing,
  parentTitle,
}: {
  goal: Goal;
  editing: boolean;
  parentTitle?: string;
}) {
  const [title, setTitle] = useState(goal.title);
  const [, startTransition] = useTransition();

  function save(patch: { title?: string; icon?: IconKey }) {
    startTransition(async () => {
      const result = await updateGoalAction({ id: goal.id, ...patch });
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <li className="flex items-start gap-2.5 px-4 py-2.5">
      {editing ? (
        <IconPicker value={goal.icon} onChange={(icon) => save({ icon })} />
      ) : (
        <GoalIcon icon={goal.icon} className="mt-0.5 text-muted-foreground" />
      )}

      <div className="min-w-0 flex-1">
        {editing ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            // Commit on blur rather than per keystroke — one write per edit.
            onBlur={() => title !== goal.title && save({ title })}
            aria-label={`Title: ${goal.title}`}
            className="h-7 text-sm"
          />
        ) : (
          <p className="text-sm leading-snug">{goal.title}</p>
        )}

        {goal.note ? (
          <p className="mt-1 text-xs text-muted-foreground">{goal.note}</p>
        ) : null}

        {parentTitle ? (
          <span className="mt-1 inline-flex max-w-full items-center gap-1 text-[11px] text-muted-foreground">
            <ArrowUp className="size-3 shrink-0" />
            <span className="truncate">{parentTitle}</span>
          </span>
        ) : null}
      </div>

      {goal.badge ? (
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {goal.badge}
        </Badge>
      ) : null}

      {goal.tier === "week" && goal.target ? (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {goal.target}
          {goal.unit === "hours" ? "h" : "×"}
        </span>
      ) : null}
    </li>
  );
}

function AddGoalRow({ tier }: { tier: GoalTier }) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [pending, startTransition] = useTransition();

  function add() {
    if (!title.trim()) return;
    startTransition(async () => {
      const result = await createGoalAction({
        title,
        tier,
        // Weekly Inputs need a number; a blank target defaults to 1.
        target: tier === "week" ? Number(target) || 1 : null,
        unit: tier === "week" ? "hours" : null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setTitle("");
      setTarget("");
    });
  }

  return (
    <div className="flex items-center gap-2 border-t bg-muted/40 px-4 py-2.5">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        placeholder={tier === "week" ? "New input…" : "New…"}
        className="h-7 text-sm"
      />
      {tier === "week" ? (
        <Input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          inputMode="numeric"
          placeholder="0"
          aria-label="Weekly target"
          className="h-7 w-14 text-sm"
        />
      ) : null}
      <Button
        size="icon"
        variant="ghost"
        className="size-7 shrink-0"
        aria-label="Add"
        disabled={pending || !title.trim()}
        onClick={add}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
