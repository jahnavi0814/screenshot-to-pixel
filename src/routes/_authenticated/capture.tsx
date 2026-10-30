import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { createIntention } from "@/lib/intentions.functions";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/capture")({
  head: () => ({
    meta: [
      { title: "Capture an almost — Almost" },
      { property: "og:title", content: "Capture an almost — Almost" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CapturePage,
});

function CapturePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createFn = useServerFn(createIntention);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [blocker, setBlocker] = useState("");
  const [smallVersion, setSmallVersion] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [people, setPeople] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Just one thing: what have you been meaning to do?");
      return;
    }
    setSaving(true);
    try {
      // The "small version" is saved as the first next step.
      const created = await createFn({
        title: title.trim(),
        why_it_matters: why.trim(),
        blocker: blocker.trim(),
        category: category as (typeof CATEGORIES)[number],
        people_involved: people.trim(),
        timeframe: timeframe.trim(),
        notes: notes.trim(),
      });
      if (smallVersion.trim()) {
        const { setNextStep } = await import("@/lib/intentions.functions");
        await setNextStep({ data: { id: (created as { id: string }).id, next_step: smallVersion.trim() } });
      }
      await queryClient.invalidateQueries({ queryKey: ["intentions"] });
      setSaved(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="paper-texture flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <p className="heading-serif fade-up max-w-xl text-2xl leading-relaxed text-foreground sm:text-3xl">
          Some things deserve a little space before they become plans.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          It's saved, whenever you want to come back to it.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="rounded-full">
            <Link to="/almosts">See it in My Almosts</Link>
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              setTitle("");
              setWhy("");
              setBlocker("");
              setSmallVersion("");
              setCategory("other");
              setPeople("");
              setTimeframe("");
              setNotes("");
              setSaved(false);
            }}
          >
            Capture another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="heading-serif text-3xl text-foreground sm:text-4xl">
        What's something you've been meaning to do?
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Nothing here is mandatory except the first line. Incomplete is fine.
      </p>

      <div className="mt-10 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">What have you been meaning to do?</Label>
          <Textarea
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
            autoFocus
            placeholder="e.g. Learn how to play the piano"
            className="text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="why">Why does it matter to you?</Label>
          <Textarea
            id="why"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            rows={3}
            placeholder="Only if you want to."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="blocker">What's stopping you?</Label>
          <Textarea
            id="blocker"
            value={blocker}
            onChange={(e) => setBlocker(e.target.value)}
            rows={3}
            placeholder="Be honest — nobody else reads this."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="small">Is there a small version of this you could try?</Label>
          <Input
            id="small"
            value={smallVersion}
            onChange={(e) => setSmallVersion(e.target.value)}
            placeholder="e.g. Watch one 10-minute piano video"
          />
        </div>

        {/* Optional details */}
        <div className="rounded-2xl border border-border bg-card">
          <button
            type="button"
            onClick={() => setDetailsOpen((o) => !o)}
            aria-expanded={detailsOpen}
            className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-foreground"
          >
            A few optional details
            <ChevronDown
              className={cn("size-4 transition-transform", detailsOpen && "rotate-180")}
              aria-hidden
            />
          </button>
          {detailsOpen && (
            <div className="space-y-5 border-t border-border px-5 py-5">
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={category === c}
                      onClick={() => setCategory(c)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs transition-colors",
                        category === c
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:bg-secondary",
                      )}
                    >
                      {CATEGORY_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="people">People involved</Label>
                  <Input
                    id="people"
                    value={people}
                    onChange={(e) => setPeople(e.target.value)}
                    placeholder="e.g. Sam"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeframe">Expected timeframe</Label>
                  <Input
                    id="timeframe"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    placeholder="e.g. someday, this spring"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Personal notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pb-8">
          <Button variant="ghost" onClick={() => navigate({ to: "/home" })}>
            Not now
          </Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-full px-8">
            {saving ? "Saving…" : "Save it"}
          </Button>
        </div>
      </div>
    </div>
  );
}
