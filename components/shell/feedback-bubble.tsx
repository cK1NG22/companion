"use client";

import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ResponsiveModal } from "@/components/common/responsive-modal";
import { submitFeedbackAction } from "@/lib/actions/feedback";
import type { FeedbackKind } from "@/lib/types";

/**
 * The floating circle, present on every tab (PRD §4.11).
 *
 * Two modes share one queue and differ only by `kind`:
 *   improve app → the runner edits the repo
 *   date idea   → the runner researches it into the Date planner
 */
export function FeedbackBubble() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>("app_edit");
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();

  function submit() {
    startTransition(async () => {
      const result = await submitFeedbackAction({
        text,
        kind,
        tab: pathname === "/" ? "home" : pathname.replace("/", ""),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setText("");
      setOpen(false);
      toast.success(
        kind === "app_edit" ? "Queued for the runner." : "Queued for research.",
      );
    });
  }

  return (
    <>
      <Button
        size="icon"
        aria-label="Send feedback"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-50 size-12 rounded-full shadow-lg"
      >
        <MessageCircle className="size-5" strokeWidth={1.8} />
      </Button>

      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title="What would you like to change?"
        description="Improve the app, or drop a date idea to research."
      >
        <div className="grid gap-3">
          {/* Base UI's ToggleGroup is array-valued even in single-select mode;
              an empty array means the active item was clicked again. */}
          <ToggleGroup
            value={[kind]}
            onValueChange={(v) => {
              const next = v[0];
              if (next) setKind(next as FeedbackKind);
            }}
            variant="outline"
            className="w-full"
          >
            <ToggleGroupItem value="app_edit" className="flex-1">
              Improve app
            </ToggleGroupItem>
            <ToggleGroupItem value="date_research" className="flex-1">
              Date idea
            </ToggleGroupItem>
          </ToggleGroup>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={
              kind === "app_edit"
                ? "On the Calendar tab, make past events fade more…"
                : "That pottery place downtown — find out what a class costs…"
            }
          />

          <Button onClick={submit} disabled={pending || !text.trim()}>
            {pending ? "Sending…" : "Send"}
          </Button>
        </div>
      </ResponsiveModal>
    </>
  );
}
