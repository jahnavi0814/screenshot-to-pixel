import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Check, Pencil, Trash2 } from "lucide-react";
import {
  deleteIntention,
  getIntention,
  setNextStep,
  updateIntention,
  updateIntentionStatus,
} from "@/lib/intentions.functions";
import {
  createReflection,
  deleteReflection,
  listIntentionReflections,
} from "@/lib/reflections.functions";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  STATUSES,
  STATUS_LABELS,
  type Category,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/intention-card";
import type { IntentionRow } from "@/components/intention-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/almosts/$id")({
  head: () => ({
    meta: [
      { title: "An almost — Almost" },
      { property: "og:title", content: "An almost — Almost" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntentionDetailPage,
});

function IntentionDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getFn = useServerFn(getIntention);
  const deleteFn = useServerFn(deleteIntention);
  const updateFn = useServerFn(updateIntention);
  const updateStatusFn = useServerFn(updateIntentionStatus);
  const setNextStepFn = useServerFn(setNextStep);
  const createReflectionFn = useServerFn(createReflection);
  const listReflectionsFn = useServerFn(listIntentionReflections);
  const deleteReflectionFn = useServerFn(deleteReflection);

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: intention, isLoading } = useQuery({
    queryKey: ["intention", id],
    queryFn: () => getFn({ data: { id } }) as Promise<IntentionRow | null>,
  });

  const { data: reflections } = useQuery({
    queryKey: ["reflections", "intention", id],
    queryFn: () => listReflectionsFn({ data: { intention_id: id } }),
  });

  const invalidate = () => queryClient.invalidateQueries();

  const changeStatus = async (status: string) => {
    if (!intention || status === intention.status) return;
    setBusy(true);
    try {
      await updateStatusFn({ data: { id, status: status as never } });
      await invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const toggleArchived = async () => {
    if (!intention) return;
    setBusy(true);
    try {
      await updateFn({
        data: { id, title: intention.title, archived: !intention.archived },
      });
      await invalidate();
      toast.success(intention.archived ? "Brought back." : "Set aside, quietly.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteFn({ data: { id } });
      await invalidate();
      navigate({ to: "/almosts", replace: true });
    } catch (err) {
      setBusy(false);
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-10">
        <Skeleton className="h-8 w-40 rounded-full" />
        <Skeleton className="h-12 w-3/4 rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!intention) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="heading-serif text-2xl text-foreground">This one isn't here.</p>
        <p className="mt-3 text-sm text-muted-foreground">
          It may have been deleted.
        </p>
        <Button asChild variant="outline" className="mt-6 rounded-full">
          <Link to="/almosts">Back to My Almosts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        to="/almosts"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        My Almosts
      </Link>

      {editing ? (
        <EditForm
          key={intention.id}
          intention={intention}
          onDone={() => {
            setEditing(false);
            void invalidate();
          }}
        />
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="heading-serif text-3xl leading-tight text-foreground sm:text-4xl">
                {intention.title}
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <StatusBadge status={intention.status as never} />
                <span aria-hidden>·</span>
                <span>{CATEGORY_LABELS[intention.category as Category] ?? "Other"}</span>
                <span aria-hidden>·</span>
                <span>
                  added {formatDistanceToNow(new Date(intention.created_at), { addSuffix: true })}
                </span>
                {intention.revisit_count > 0 && (
                  <>
                    <span aria-hidden>·</span>
                    <span>revisited {intention.revisit_count}×</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="rounded-full"
              >
                <Pencil className="size-3.5" aria-hidden />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="heading-serif text-foreground">
                      Let this one go?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete “{intention.title}” and any reflections attached
                      to it. This can't be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep it</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        void remove();
                      }}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Status */}
          <section className="mt-10 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-medium text-foreground">Where is this now?</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {STATUSES.map((s) => {
                const selected = intention.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={selected}
                    disabled={busy}
                    onClick={() => void changeStatus(s)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-colors disabled:opacity-60",
                      selected
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-secondary",
                    )}
                  >
                    {selected && <Check className="mr-1 inline size-3.5" aria-hidden />}
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => void toggleArchived()}
                className="text-muted-foreground"
              >
                {intention.archived ? "Bring it back" : "Set aside for now"}
              </Button>
            </div>
          </section>

          {/* Next step */}
          <NextStepCard
            key={`next-${intention.id}-${intention.next_step ?? ""}`}
            intention={intention}
            onSave={async (step) => {
              await setNextStepFn({ data: { id, next_step: step } });
              await invalidate();
            }}
          />

          {/* Details */}
          <section className="mt-8 space-y-4">
            <Detail label="Why it matters" value={intention.why_it_matters} />
            <Detail label="What's stopping you" value={intention.blocker} />
            <Detail label="Notes" value={intention.description} />
            <Detail label="A smaller version" value={intention.notes} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Detail label="Timeframe" value={intention.timeframe} />
              <Detail label="People involved" value={intention.people_involved} />
            </div>
          </section>

          {/* Reflections attached to this almost */}
          <section className="mt-12">
            <h2 className="heading-serif text-2xl text-foreground">Reflections</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thoughts you've kept alongside this one.
            </p>
            <ReflectionComposer
              onSave={async (content) => {
                await createReflectionFn({ data: { content, intention_id: id } });
                await invalidate();
              }}
            />
            {(reflections ?? []).length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                None yet. Whenever something comes to mind, it can live here.
              </p>
            ) : (
              <ul className="mt-6 space-y-3">
                {(reflections ?? []).map((r) => (
                  <li
                    key={r.id}
                    className="group rounded-2xl border border-border bg-card p-5"
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {r.content}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteReflectionFn({ data: { id: r.id } });
                          await invalidate();
                        }}
                        className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:text-destructive"
                        aria-label="Delete this reflection"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {value}
      </p>
    </div>
  );
}

function NextStepCard({
  intention,
  onSave,
}: {
  intention: IntentionRow;
  onSave: (step: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(intention.next_step ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!step.trim()) return;
    setSaving(true);
    try {
      await onSave(step.trim());
      setOpen(false);
      toast.success("A little more possible.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-8 rounded-2xl border border-terracotta/40 bg-terracotta-wash/60 p-6">
      {intention.next_step && !open ? (
        <>
          <p className="text-xs uppercase tracking-widest text-terracotta">Next step</p>
          <p className="heading-serif mt-2 text-xl text-foreground">
            {intention.next_step}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 rounded-full"
            onClick={() => {
              setStep(intention.next_step ?? "");
              setOpen(true);
            }}
          >
            Change the step
          </Button>
        </>
      ) : open ? (
        <>
          <p className="text-xs uppercase tracking-widest text-terracotta">Next step</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Input
              value={step}
              onChange={(e) => setStep(e.target.value)}
              placeholder="e.g. Watch one 10-minute piano video"
              onKeyDown={(e) => {
                if (e.key === "Enter") void save();
              }}
              autoFocus
            />
            <Button onClick={() => void save()} disabled={saving || !step.trim()}>
              {saving ? "Saving…" : "Save step"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="heading-serif text-lg text-foreground">
            No step yet — that's alright.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 rounded-full"
            onClick={() => {
              setStep("");
              setOpen(true);
            }}
          >
            Make it a little more possible
          </Button>
        </>
      )}
    </section>
  );
}

function ReflectionComposer({ onSave }: { onSave: (content: string) => Promise<void> }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await onSave(content.trim());
      setContent("");
      toast.success("Kept.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5">
      <Label htmlFor="detail-reflection" className="sr-only">
        Add a reflection
      </Label>
      <Textarea
        id="detail-reflection"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Something you noticed, or how you feel about it now…"
      />
      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          onClick={() => void save()}
          disabled={saving || !content.trim()}
          className="rounded-full"
        >
          {saving ? "Saving…" : "Save reflection"}
        </Button>
      </div>
    </div>
  );
}

function EditForm({
  intention,
  onDone,
}: {
  intention: IntentionRow;
  onDone: () => void;
}) {
  const updateFn = useServerFn(updateIntention);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: intention.title,
    description: intention.description ?? "",
    why_it_matters: intention.why_it_matters ?? "",
    blocker: intention.blocker ?? "",
    category: (intention.category as Category) ?? "other",
    timeframe: intention.timeframe ?? "",
    people_involved: intention.people_involved ?? "",
    notes: intention.notes ?? "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Just one thing: what have you been meaning to do?");
      return;
    }
    setSaving(true);
    try {
      await updateFn({
        data: {
          id: intention.id,
          title: form.title.trim(),
          description: form.description.trim(),
          why_it_matters: form.why_it_matters.trim(),
          blocker: form.blocker.trim(),
          category: form.category,
          timeframe: form.timeframe.trim(),
          people_involved: form.people_involved.trim(),
          notes: form.notes.trim(),
        },
      });
      toast.success("Saved.");
      onDone();
    } catch (err) {
      setSaving(false);
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div className="mt-6 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="edit-title">What have you been meaning to do?</Label>
        <Textarea
          id="edit-title"
          value={form.title}
          onChange={(e) => set("title")(e.target.value)}
          rows={2}
          className="text-lg"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-why">Why does it matter to you?</Label>
        <Textarea
          id="edit-why"
          value={form.why_it_matters}
          onChange={(e) => set("why_it_matters")(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-blocker">What's stopping you?</Label>
        <Textarea
          id="edit-blocker"
          value={form.blocker}
          onChange={(e) => set("blocker")(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-notes">A smaller version / notes</Label>
        <Textarea
          id="edit-notes"
          value={form.notes}
          onChange={(e) => set("notes")(e.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={form.category === c}
              onClick={() => set("category")(c)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                form.category === c
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
          <Label htmlFor="edit-timeframe">Timeframe</Label>
          <Input
            id="edit-timeframe"
            value={form.timeframe}
            onChange={(e) => set("timeframe")(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-people">People involved</Label>
          <Input
            id="edit-people"
            value={form.people_involved}
            onChange={(e) => set("people_involved")(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-description">Personal notes</Label>
        <Textarea
          id="edit-description"
          value={form.description}
          onChange={(e) => set("description")(e.target.value)}
          rows={3}
        />
      </div>
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onDone} className="text-muted-foreground">
          Cancel
        </Button>
        <Button onClick={() => void save()} disabled={saving} className="rounded-full px-8">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
