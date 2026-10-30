import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import { PlusCircle } from "lucide-react";
import { listIntentions } from "@/lib/intentions.functions";
import { getWeeklySummary } from "@/lib/reflections.functions";
import { getMyProfile } from "@/lib/profile.functions";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  REFLECTION_PROMPTS,
  timeGreeting,
  type Category,
  type Status,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — Almost" },
      { property: "og:title", content: "Home — Almost" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

type IntentionRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  next_step: string | null;
  created_at: string;
  revisit_count: number;
};

function HomePage() {
  const listFn = useServerFn(listIntentions);
  const summaryFn = useServerFn(getWeeklySummary);
  const profileFn = useServerFn(getMyProfile);

  const { data: intentions, isLoading } = useQuery({
    queryKey: ["intentions", "all"],
    queryFn: () => listFn({ data: { sort: "recent" } }) as Promise<IntentionRow[]>,
  });

  const { data: summary } = useQuery({
    queryKey: ["weekly-summary"],
    queryFn: () => summaryFn(),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileFn(),
  });

  const active = (intentions ?? []).filter((i) => !i.archived);
  const recent = active.slice(0, 3);
  const revisitCandidate = [...active]
    .filter(
      (i) =>
        i.status === "still_thinking" &&
        Date.now() - new Date(i.created_at).getTime() > 14 * 24 * 60 * 60 * 1000,
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const prompt =
    REFLECTION_PROMPTS[weekNumber % REFLECTION_PROMPTS.length] ??
    REFLECTION_PROMPTS[0];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-sm text-muted-foreground">
        {timeGreeting(new Date().getHours())}
        {profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
      </p>
      <h1 className="heading-serif mt-1 text-3xl text-foreground sm:text-4xl">
        What's been on your mind?
      </h1>

      <Button asChild size="lg" className="mt-6 rounded-full">
        <Link to="/capture">
          <PlusCircle className="size-5" aria-hidden />
          Capture an almost
        </Link>
      </Button>

      {isLoading ? (
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      ) : active.length === 0 ? (
        <div className="fade-up mt-12 rounded-2xl border border-border bg-card p-10 text-center">
          <p className="heading-serif text-2xl text-foreground">Nothing here yet.</p>
          <p className="mt-3 text-sm text-muted-foreground">
            That's okay. Start with something you've been thinking about.
          </p>
          <Button asChild variant="outline" className="mt-6 rounded-full">
            <Link to="/capture">Capture your first almost</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Your almosts */}
          <section className="mt-12">
            <div className="flex items-baseline justify-between">
              <h2 className="heading-serif text-2xl text-foreground">Your almosts</h2>
              {active.length > 6 && (
                <Link
                  to="/almosts"
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  See all
                </Link>
              )}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {active.slice(0, 6).map((i) => (
                <IntentionCard key={i.id} intention={i} />
              ))}
            </div>
          </section>

          {/* Recently added */}
          <section className="mt-14">
            <h2 className="heading-serif text-2xl text-foreground">Recently added</h2>
            <ul className="mt-5 divide-y divide-border rounded-2xl border border-border bg-card">
              {recent.map((i) => (
                <li key={i.id}>
                  <Link
                    to="/almosts/$id"
                    params={{ id: i.id }}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-secondary/40"
                  >
                    <span className="truncate text-sm text-foreground">{i.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(i.created_at), { addSuffix: true })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Something to revisit */}
          {revisitCandidate && (
            <section className="mt-14">
              <h2 className="heading-serif text-2xl text-foreground">
                Something to revisit
              </h2>
              <div className="mt-5 rounded-2xl border border-terracotta/40 bg-terracotta-wash/60 p-6">
                <p className="text-xs uppercase tracking-widest text-terracotta">
                  Waiting quietly since{" "}
                  {new Date(revisitCandidate.created_at).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="heading-serif mt-2 text-xl text-foreground">
                  {revisitCandidate.title}
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link to="/almosts/$id" params={{ id: revisitCandidate.id }}>
                    Revisit this
                  </Link>
                </Button>
              </div>
            </section>
          )}

          {/* A little reflection */}
          <section className="mt-14 mb-4">
            <h2 className="heading-serif text-2xl text-foreground">A little reflection</h2>
            <div className="mt-5 rounded-2xl border border-border bg-card p-6">
              <p className="heading-serif text-lg text-foreground">“{prompt}”</p>
              <Button asChild variant="ghost" size="sm" className="mt-3 text-muted-foreground">
                <Link to="/reflect">Take a moment to write</Link>
              </Button>
            </div>
            {summary && (
              <p className="mt-4 text-xs text-muted-foreground">
                This week you've captured {summary.newIntentions}, revisited{" "}
                {summary.revisited}, taken {summary.smallSteps} small step
                {summary.smallSteps === 1 ? "" : "s"}, and let go of {summary.letGo}.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export function IntentionCard({ intention }: { intention: IntentionRow }) {
  const status = intention.status as Status;
  const category = intention.category as Category;
  return (
    <Link
      to="/almosts/$id"
      params={{ id: intention.id }}
      className="fade-up flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="heading-serif text-lg leading-snug text-foreground">
          {intention.title}
        </h3>
        <StatusBadge status={status} />
      </div>
      {intention.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {intention.description}
        </p>
      )}
      {intention.next_step && (
        <p className="mt-3 text-xs text-foreground/80">
          <span className="font-medium text-terracotta">Next step · </span>
          {intention.next_step}
        </p>
      )}
      <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-muted-foreground">
        <span>{CATEGORY_LABELS[category] ?? CATEGORY_LABELS.other}</span>
        <span aria-hidden>·</span>
        <span>
          added{" "}
          {formatDistanceToNow(new Date(intention.created_at), { addSuffix: true })}
        </span>
      </div>
    </Link>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const tone =
    status === "completed"
      ? "bg-sage-wash text-foreground"
      : status === "no_longer_relevant"
        ? "bg-muted text-muted-foreground"
        : status === "taking_small_step"
          ? "bg-terracotta-wash text-foreground"
          : "bg-secondary text-secondary-foreground";
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${tone}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
