"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowRight, Check, GripVertical, MoreVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  addMorningSectionAction,
  deleteMorningSectionAction,
  markMorningDoneAction,
  reorderMorningSectionsAction,
  updateMorningSectionAction,
} from "@/lib/actions/rhythm";
import type { MorningSection } from "@/lib/types";

/**
 * Morning Review (PRD §4.8): the same examination read every day. A reading,
 * not a checklist — there are deliberately no per-section checkboxes.
 *
 * Editing uses Google-Forms mechanics: enter edit mode, drag to reorder, edit
 * titles and text inline, delete, add.
 */
export function MorningReview({ sections }: { sections: MorningSection[] }) {
  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState(sections);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = order.findIndex((s) => s.id === active.id);
    const to = order.findIndex((s) => s.id === over.id);
    const next = arrayMove(order, from, to);
    setOrder(next);
    startTransition(() =>
      reorderMorningSectionsAction(next.map((s) => s.id)),
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {editing ? "Editing" : "Read this before anything else"}
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Section options" />
            }
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing((v) => !v)}>
              {editing ? "Done editing" : "Edit sections"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => startTransition(() => addMorningSectionAction())}
            >
              <Plus className="size-3.5" /> Add section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="gap-0 p-0 shadow-card">
        <div className="border-b px-5 py-4">
          <h3 className="text-base font-semibold">Morning Review</h3>
          <p className="text-xs text-muted-foreground">
            The same examination, every day.
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={order.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="divide-y">
              {order.map((section) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  editing={editing}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </Card>

      {!editing ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => startTransition(() => markMorningDoneAction())}
          >
            <Check className="size-4" /> Done for today
          </Button>
          {/* Morning Review → Scripture → Plan the day (PRD §4.8). */}
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/scripture" />}
          >
            Next: read scriptures <ArrowRight className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/plan-today" />}
          >
            Plan the day <ArrowRight className="size-3.5" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function SectionRow({
  section,
  editing,
}: {
  section: MorningSection;
  editing: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id, disabled: !editing });
  const [title, setTitle] = useState(section.title);
  const [body, setBody] = useState(section.body);
  const [, startTransition] = useTransition();

  function save() {
    if (title === section.title && body === section.body) return;
    startTransition(() =>
      updateMorningSectionAction({ id: section.id, title, body }),
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={
        isDragging
          ? "relative z-10 bg-card opacity-90 shadow-lg"
          : "bg-card"
      }
    >
      <div className="flex items-start gap-2 px-5 py-4">
        {editing ? (
          <button
            type="button"
            className="mt-0.5 cursor-grab text-muted-foreground active:cursor-grabbing"
            aria-label={`Reorder ${section.title}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        ) : null}

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="grid gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={save}
                className="h-8 font-medium"
              />
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onBlur={save}
                rows={3}
                className="prose-devotional text-sm"
              />
            </div>
          ) : (
            <>
              <h4 className="text-sm font-semibold">{section.title}</h4>
              {section.body ? (
                <p className="prose-devotional mt-1 text-[15px] text-muted-foreground">
                  {section.body}
                </p>
              ) : null}
            </>
          )}
        </div>

        {editing ? (
          <Button
            size="icon"
            variant="ghost"
            className="size-7 shrink-0 text-muted-foreground"
            aria-label={`Delete ${section.title}`}
            onClick={() =>
              startTransition(() => deleteMorningSectionAction(section.id))
            }
          >
            <Trash2 className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
