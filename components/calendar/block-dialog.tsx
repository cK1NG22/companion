"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveModal } from "@/components/common/responsive-modal";
import {
  createBlockAction,
  deleteBlockAction,
  updateBlockAction,
} from "@/lib/actions/calendar";
import type { CalendarBlock, Goal } from "@/lib/types";

/** What the dialog is editing: an existing block, or a fresh time range. */
export type BlockDraft =
  | { mode: "edit"; block: CalendarBlock }
  | { mode: "create"; start: string; end: string };

/** "2026-07-27T09:00:00" → "09:00", for <input type="time">. */
const timeOf = (iso: string) => iso.slice(11, 16);
const dateOf = (iso: string) => iso.slice(0, 10);

export function BlockDialog({
  draft,
  goals,
  onClose,
}: {
  draft: BlockDraft | null;
  goals: Goal[];
  onClose: () => void;
}) {
  return (
    <ResponsiveModal
      open={draft !== null}
      onOpenChange={(o) => !o && onClose()}
      title={draft?.mode === "edit" ? "Edit block" : "New block"}
      description="Naming it and assigning a goal is what fills Planned on Home."
    >
      {/* The form seeds its state from props, and the key remounts it whenever
          a different block or time range is opened. That's the React-idiomatic
          alternative to syncing state with an effect. */}
      {draft ? (
        <BlockForm
          key={draft.mode === "edit" ? draft.block.id : draft.start}
          draft={draft}
          goals={goals}
          onClose={onClose}
        />
      ) : null}
    </ResponsiveModal>
  );
}

function BlockForm({
  draft,
  goals,
  onClose,
}: {
  draft: BlockDraft;
  goals: Goal[];
  onClose: () => void;
}) {
  const initial =
    draft.mode === "edit"
      ? {
          name: draft.block.name,
          goalId: draft.block.goalId ?? "none",
          date: dateOf(draft.block.start),
          start: timeOf(draft.block.start),
          end: timeOf(draft.block.end),
        }
      : {
          name: "",
          goalId: "none",
          date: dateOf(draft.start),
          start: timeOf(draft.start),
          end: timeOf(draft.end),
        };

  const [name, setName] = useState(initial.name);
  const [goalId, setGoalId] = useState(initial.goalId);
  const [date, setDate] = useState(initial.date);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [pending, startTransition] = useTransition();

  function save() {
    const payload = {
      name,
      start: `${date}T${start}:00`,
      end: `${date}T${end}:00`,
      goalId: goalId === "none" ? null : goalId,
    };
    startTransition(async () => {
      const result =
        draft.mode === "edit"
          ? await updateBlockAction({ id: draft.block.id, ...payload })
          : await createBlockAction(payload);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onClose();
    });
  }

  function remove() {
    if (draft.mode !== "edit") return;
    const id = draft.block.id;
    startTransition(async () => {
      await deleteBlockAction(id);
      onClose();
    });
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="block-name">Event name</Label>
        <Input
          id="block-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Companion build"
          autoFocus
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="block-goal">Goal</Label>
        {/* Base UI's Select emits null when cleared; "none" is our sentinel. */}
        <Select value={goalId} onValueChange={(v) => setGoalId(v ?? "none")}>
          <SelectTrigger id="block-goal">
            <SelectValue placeholder="No goal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No goal</SelectItem>
            {goals.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor="block-date">Date</Label>
          <Input
            id="block-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="block-start">Start</Label>
          <Input
            id="block-start"
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="block-end">End</Label>
          <Input
            id="block-end"
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-1 flex items-center gap-2">
        <Button
          onClick={save}
          disabled={pending || !name.trim()}
          className="flex-1"
        >
          {draft.mode === "edit" ? "Save" : "Add block"}
        </Button>
        {draft.mode === "edit" ? (
          <Button
            variant="outline"
            size="icon"
            aria-label="Delete block"
            onClick={remove}
            disabled={pending}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
