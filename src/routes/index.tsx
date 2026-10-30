import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Almost — For everything you almost did" },
      {
        name: "description",
        content:
          "Almost is a quiet space for everything you've been putting off. Capture it, understand it, and decide what happens next.",
      },
      { property: "og:title", content: "Almost — For everything you almost did" },
      {
        property: "og:description",
        content:
          "A quiet space for everything you've been putting off. Capture it, understand it, and decide what happens next.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const FLOATING_INTENTIONS = [
  { title: "Learn how to play the piano", tilt: "-2deg", top: "6%", left: "6%", delay: "0s" },
  { title: "Build that idea I've been thinking about", tilt: "1.5deg", top: "2%", left: "48%", delay: "1.2s" },
  { title: "Reach out to an old friend", tilt: "2deg", top: "38%", left: "20%", delay: "2.1s" },
  { title: "Take a solo trip somewhere", tilt: "-1.5deg", top: "36%", left: "62%", delay: "0.8s" },
  { title: "Start learning design", tilt: "1deg", top: "70%", left: "38%", delay: "1.7s" },
];

const PHILOSOPHY = [
  "No pressure to be productive.",
  "No guilt about unfinished plans.",
  "No competition with anyone.",
  "Just a little more awareness of what matters to you.",
];

const HOW_IT_WORKS = [
  {
    step: "One",
    title: "Capture what you've been meaning to do.",
    body: "In your own words, without making it a task. A sentence is enough.",
  },
  {
    step: "Two",
    title: "Understand what's holding you back.",
    body: "Notice the patterns behind the postponing — gently, not judgmentally.",
  },
  {
    step: "Three",
    title: "Revisit it when you're ready.",
    body: "Some things need time. Almost keeps them safe until you come back.",
  },
  {
    step: "Four",
    title: "Take a small step, or let it go.",
    body: "Both are honest answers. Not every intention needs to become an achievement.",
  },
];

function LandingPage() {
  return (
    <div className="paper-texture min-h-screen">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="heading-serif text-2xl text-foreground">Almost</span>
        <Link
          to="/auth"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-16 text-center md:pt-24">
        <h1 className="heading-serif fade-up text-4xl leading-tight text-foreground sm:text-5xl md:text-6xl">
          There's probably something you've been meaning to do.
        </h1>
        <p className="fade-up mx-auto mt-8 max-w-2xl text-lg text-foreground/80">
          An idea you haven't pursued. A conversation you haven't started. A version of
          yourself you've been meaning to explore.
        </p>
        <p className="fade-up mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
          Almost is a quiet space for everything you've been putting off. Capture it,
          understand it, and decide what happens next.
        </p>
        <div className="fade-up mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/auth"
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90"
          >
            Start with something small
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-card px-7 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Explore how it works
          </a>
        </div>
      </section>

      {/* Floating intentions */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="relative hidden h-[420px] md:block" aria-hidden="true">
          {FLOATING_INTENTIONS.map((card) => (
            <div
              key={card.title}
              className="float-soft absolute w-56 rounded-2xl border border-border bg-card p-5 shadow-sm"
              style={
                {
                  top: card.top,
                  left: card.left,
                  animationDelay: card.delay,
                  "--tilt": card.tilt,
                } as React.CSSProperties
              }
            >
              <p className="text-sm leading-relaxed text-foreground">“{card.title}.”</p>
              <p className="mt-3 text-xs text-muted-foreground">almost · someday</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 md:hidden" aria-hidden="true">
          {FLOATING_INTENTIONS.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <p className="text-sm text-foreground">“{card.title}.”</p>
            </div>
          ))}
        </div>
      </section>

      {/* Philosophy */}
      <section className="border-y border-border bg-card/60 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="heading-serif text-3xl text-foreground sm:text-4xl">
            Not another to-do list.
          </h2>
          <div className="mt-10 space-y-5">
            {PHILOSOPHY.map((line, i) => (
              <p
                key={line}
                className={
                  i === PHILOSOPHY.length - 1
                    ? "heading-serif text-xl text-terracotta"
                    : "text-lg text-foreground/80"
                }
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-5xl scroll-mt-8 px-6 py-24">
        <h2 className="heading-serif text-3xl text-foreground sm:text-4xl">
          How Almost works
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {HOW_IT_WORKS.map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <span className="text-xs font-medium uppercase tracking-widest text-terracotta">
                {item.step}
              </span>
              <h3 className="heading-serif mt-3 text-xl text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-card/60 py-24 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="heading-serif text-3xl text-foreground sm:text-4xl">
            Sometimes people need to start. Sometimes they need to reconsider. And
            sometimes they're allowed to let go.
          </h2>
          <p className="mt-6 text-base text-muted-foreground">
            Whatever it is, it deserves a quiet place to live.
          </p>
          <Link
            to="/auth"
            className="mt-10 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            Start with something small
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <footer className="py-10 text-center">
        <p className="heading-serif text-lg text-foreground">Almost.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          For everything you almost did.
        </p>
      </footer>
    </div>
  );
}
