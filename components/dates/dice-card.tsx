"use client";

import { useTransition } from "react";
import { Dice5 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { scheduleDateAction } from "@/lib/actions/dates";
import type { DiceRoll } from "@/lib/types";

export function DiceCard({
  roll,
  onClose,
  onReroll,
}: {
  roll: DiceRoll;
  onClose: () => void;
  onReroll: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const places = [roll.food, roll.activity].filter(Boolean) as {
    name: string;
    address?: string;
  }[];

  return (
    <Card className="gap-3 border-2 px-5 py-4 shadow-card">
      <div className="flex items-center gap-2">
        <Dice5 className="size-4 text-warm" />
        <h2 className="text-sm font-semibold">Try something new</h2>
      </div>
      <div className="grid gap-1 text-sm">
        <p>
          <span className="text-muted-foreground">Food · </span>
          {roll.food?.name ?? "nothing in range"}
        </p>
        <p>
          <span className="text-muted-foreground">Activity · </span>
          {roll.activity?.name ?? "nothing in range"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={pending || places.length === 0}
          onClick={() =>
            startTransition(async () => {
              const result = await scheduleDateAction({
                places: places.map((p) => ({
                  name: p.name,
                  address: p.address ?? "",
                })),
              });
              if (result.ok) toast.success(result.message);
              else toast.error(result.error);
            })
          }
        >
          Schedule both
        </Button>
        <Button size="sm" variant="outline" onClick={onReroll}>
          Re-roll
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Dismiss
        </Button>
      </div>
    </Card>
  );
}
