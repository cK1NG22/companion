"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
} from "@fullcalendar/core";
import { ChevronDown, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GoalIcon } from "@/components/common/goal-icon";
import { BlockDialog, type BlockDraft } from "@/components/calendar/block-dialog";
import { updateBlockAction } from "@/lib/actions/calendar";
import { toLocalIso } from "@/lib/data/calendar";
import type { CalendarBlock, Goal, IconKey } from "@/lib/types";
import "./fullcalendar-theme.css";

type ViewKey = "timeGridDay" | "timeGridThreeDay" | "timeGridWeek";

const VIEW_LABELS: Record<ViewKey, string> = {
  timeGridDay: "Day",
  timeGridThreeDay: "3-day",
  timeGridWeek: "Week",
};

/**
 * The visible hour window (PRD §4.3). The full 24 hours always exist — this
 * only frames what's shown, and the grid scrolls beyond it.
 */
const HOUR_WINDOWS = [
  { label: "6 AM – 11 PM", min: "06:00:00", max: "23:00:00" },
  { label: "5 AM – 10 PM", min: "05:00:00", max: "22:00:00" },
  { label: "7 AM – 7 PM", min: "07:00:00", max: "19:00:00" },
  { label: "Full 24 hours", min: "00:00:00", max: "24:00:00" },
] as const;

export function CalendarView({
  blocks,
  goals,
  goalIcons,
  anchor,
}: {
  blocks: CalendarBlock[];
  goals: Goal[];
  goalIcons: Record<string, IconKey | null>;
  /** Monday of the week selected by `?w=` — the grid must show THIS week. */
  anchor: string;
}) {
  const calendarRef = useRef<FullCalendar>(null);
  const [view, setView] = useState<ViewKey>("timeGridWeek");
  const [windowIndex, setWindowIndex] = useState(0);
  const [draft, setDraft] = useState<BlockDraft | null>(null);
  const [, startTransition] = useTransition();
  const hourWindow = HOUR_WINDOWS[windowIndex];

  // The page fetches blocks for `anchor`, but FullCalendar keeps its own idea
  // of "current date" across renders. Without this, stepping the week loads the
  // right blocks into a grid still showing today — they'd fall outside the
  // visible range and the week would look empty.
  useEffect(() => {
    calendarRef.current?.getApi().gotoDate(anchor);
  }, [anchor]);

  function changeView(next: ViewKey) {
    setView(next);
    calendarRef.current?.getApi().changeView(next);
  }

  /** Drag-to-create: the selected range seeds a new block. */
  function handleSelect(info: DateSelectArg) {
    setDraft({
      mode: "create",
      start: toLocalIso(info.start),
      end: toLocalIso(info.end),
    });
    info.view.calendar.unselect();
  }

  function handleEventClick(info: EventClickArg) {
    const block = blocks.find((b) => b.id === info.event.id);
    if (block) setDraft({ mode: "edit", block });
  }

  /** Dragging or resizing an existing block writes the new time straight back. */
  function handleEventChange(info: EventDropArg | { event: EventDropArg["event"]; revert: () => void }) {
    const { event, revert } = info;
    if (!event.start || !event.end) return;
    startTransition(async () => {
      const result = await updateBlockAction({
        id: event.id,
        start: toLocalIso(event.start!),
        end: toLocalIso(event.end!),
      });
      if (!result.ok) {
        toast.error(result.error);
        revert();
      }
    });
  }

  const now = Date.now();

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" />}
          >
            {VIEW_LABELS[view]}
            <ChevronDown className="size-3.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(Object.keys(VIEW_LABELS) as ViewKey[]).map((key) => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={view === key}
                onCheckedChange={() => changeView(key)}
              >
                {VIEW_LABELS[key]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="View settings" />
            }
          >
            <Settings2 className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Visible hours</DropdownMenuLabel>
            {HOUR_WINDOWS.map((w, i) => (
              <DropdownMenuCheckboxItem
                key={w.label}
                checked={windowIndex === i}
                onCheckedChange={() => setWindowIndex(i)}
              >
                {w.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <p className="ml-auto text-xs text-muted-foreground">
          Drag an empty slot to plan time.
        </p>
      </div>

      <div className="companion-calendar overflow-hidden rounded-xl border bg-card shadow-card">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          initialDate={anchor}
          views={{
            // 3-day isn't built in — it's a timeGrid with a 3-day duration.
            timeGridThreeDay: { type: "timeGrid", duration: { days: 3 } },
          }}
          // Monday is day one, everywhere (PRD §4.10).
          firstDay={1}
          headerToolbar={false}
          height="auto"
          allDaySlot={false}
          nowIndicator
          slotMinTime={hourWindow.min}
          slotMaxTime={hourWindow.max}
          slotDuration="00:30:00"
          slotLabelInterval="01:00"
          slotLabelFormat={{ hour: "numeric", meridiem: "short" }}
          dayHeaderFormat={{ weekday: "short", day: "numeric" }}
          expandRows
          selectable
          selectMirror
          editable
          eventResizableFromStart
          select={handleSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventChange}
          eventResize={handleEventChange}
          events={blocks.map((b) => ({
            id: b.id,
            title: b.name,
            start: b.start,
            end: b.end,
            extendedProps: {
              goalId: b.goalId,
              source: b.source,
              confirmed: b.confirmedMinutes !== null,
            },
          }))}
          eventClassNames={(arg) => {
            const classes: string[] = [];
            // Past = grey, Notion-style.
            if (arg.event.end && arg.event.end.getTime() < now) {
              classes.push("is-past");
            }
            if (arg.event.extendedProps.source === "google") {
              classes.push("is-google");
            }
            return classes;
          }}
          eventContent={(arg: EventContentArg) => {
            const goalId = arg.event.extendedProps.goalId as string | null;
            // A block reads [event name] + [goal icon] — never a text label.
            return (
              <div className="flex h-full items-start gap-1 overflow-hidden px-1.5 py-0.5 leading-tight">
                <GoalIcon
                  icon={goalId ? goalIcons[goalId] : null}
                  className="mt-px size-3 shrink-0 opacity-70"
                />
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                  {arg.event.title}
                </span>
              </div>
            );
          }}
        />
      </div>

      <BlockDialog
        draft={draft}
        goals={goals}
        onClose={() => setDraft(null)}
      />
    </div>
  );
}
