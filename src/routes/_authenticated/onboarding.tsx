import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { completeOnboarding } from "@/lib/profile.functions";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome — Almost" },
      { property: "og:title", content: "Welcome — Almost" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

type Cadence = "weekly" | "occasional";

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [firstTitle, setFirstTitle] = useState("");
  const [firstWhy, setFirstWhy] = useState("");
  const [blocker, setBlocker] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [cadence, setCadence] = useState<Cadence>("weekly");
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    setSaving(true);
    try {
      // completeOnboarding creates the first intention itself when one was given.
      await completeOnboarding({
        blocker: blocker.trim(),
        categories,
        cadence,
        firstAlmost: firstTitle.trim()
          ? { title: firstTitle.trim(), why_it_matters: firstWhy.trim() }
          : undefined,
      });
      await queryClient.invalidateQueries();
      navigate({ to: "/home", replace: true });
    } catch (err) {
      setSaving(false);
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div className="paper-texture flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* progress */}
        <div className="mb-10 flex items-center gap-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-terracotta" : "bg-border",
              )}
            />
          ))}
        </div>

        {step === 0 && (
          <section className="fade-up">
            <h1 className="heading-serif text-3xl text-foreground sm:text-4xl">
              What's something you've been meaning to do?
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              One sentence is enough. It doesn't have to be a plan.
            </p>
            <div className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first-title">Something I've been meaning to do</Label>
                <Input
                  id="first-title"
                  value={firstTitle}
                  onChange={(e) => setFirstTitle(e.target.value)}
                  placeholder="e.g. Learn how to play the piano"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first-why">Why does it matter to you? (optional)</Label>
                <Textarea
                  id="first-why"
                  value={firstWhy}
                  onChange={(e) => setFirstWhy(e.target.value)}
                  rows={3}
                  placeholder="Only if you feel like it."
                />
              </div>
            </div>
            <StepNav
              onSkip={() => setStep(1)}
              skipLabel="Maybe later"
              onNext={() => setStep(1)}
              nextLabel="Next"
              nextDisabled={!firstTitle.trim()}
            />
          </section>
        )}

        {step === 1 && (
          <section className="fade-up">
            <h1 className="heading-serif text-3xl text-foreground sm:text-4xl">
              What usually stops you from getting started?
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              There's no wrong answer. Skip this if you'd rather not say.
            </p>
            <div className="mt-8 space-y-2">
              <Label htmlFor="blocker" className="sr-only">
                What usually stops you
              </Label>
              <Textarea
                id="blocker"
                value={blocker}
                onChange={(e) => setBlocker(e.target.value)}
                rows={4}
                placeholder="e.g. I tell myself I'll start when things calm down."
              />
            </div>
            <StepNav
              onSkip={() => setStep(2)}
              skipLabel="Skip"
              onNext={() => setStep(2)}
              nextLabel="Next"
            />
          </section>
        )}

        {step === 2 && (
          <section className="fade-up">
            <h1 className="heading-serif text-3xl text-foreground sm:text-4xl">
              What kinds of things do you postpone most often?
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Choose any that feel familiar — or none.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const selected = categories.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setCategories((prev) =>
                        selected ? prev.filter((x) => x !== c) : [...prev, c],
                      )
                    }
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-colors",
                      selected
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-secondary",
                    )}
                  >
                    {CATEGORY_LABELS[c]}
                  </button>
                );
              })}
            </div>
            <StepNav
              onSkip={() => setStep(3)}
              skipLabel="Skip"
              onNext={() => setStep(3)}
              nextLabel="Next"
            />
          </section>
        )}

        {step === 3 && (
          <section className="fade-up">
            <h1 className="heading-serif text-3xl text-foreground sm:text-4xl">
              How would you like Almost to check in?
            </h1>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    value: "weekly",
                    title: "Gentle weekly reflections",
                    body: "A quiet prompt once a week, when you feel like it.",
                  },
                  {
                    value: "occasional",
                    title: "Occasional reminders",
                    body: "Just now and then — no rhythm, no schedule.",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={cadence === opt.value}
                  onClick={() => setCadence(opt.value)}
                  className={cn(
                    "rounded-2xl border p-5 text-left transition-colors",
                    cadence === opt.value
                      ? "border-terracotta bg-terracotta-wash"
                      : "border-border bg-card hover:bg-secondary/50",
                  )}
                >
                  <p className="font-medium text-foreground">{opt.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{opt.body}</p>
                </button>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              You can change this any time in settings.
            </p>
            <StepNav
              onSkip={finish}
              skipLabel="Skip"
              onNext={finish}
              nextLabel="Begin quietly"
              nextDisabled={saving}
            />
          </section>
        )}
      </div>
    </div>
  );
}

function StepNav({
  onSkip,
  skipLabel,
  onNext,
  nextLabel,
  nextDisabled,
}: {
  onSkip: () => void;
  skipLabel: string;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-10 flex items-center justify-between">
      <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
        {skipLabel}
      </Button>
      <Button onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
      </Button>
    </div>
  );
}
