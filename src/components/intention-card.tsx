import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  type Category,
  type Status,
} from "@/lib/constants";

export type IntentionRow = {
  id: string;
  title: string;
  description: string | null;
  why_it_matters: string | null;
  blocker: string | null;
  category: string;
  status: string;
  next_step: string | null;
  notes: string | null;
  timeframe: string | null;
  people_involved: string | null;
  archived: boolean;
  revisit_count: number;
  created_at: string;
  status_changed_at: string;
};

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
