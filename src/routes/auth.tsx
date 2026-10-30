import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Almost" },
      {
        name: "description",
        content: "Sign in or create an account on Almost, a quiet space for everything you've been meaning to do.",
      },
      { property: "og:title", content: "Sign in — Almost" },
      {
        property: "og:description",
        content: "Sign in or create an account on Almost.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  async function handleSignIn(email: string, password: string) {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/home" });
  }

  async function handleSignUp(email: string, password: string) {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/onboarding" });
      return;
    }
    setAwaitingConfirmation(true);
  }

  async function handleForgot(email: string) {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setForgotSent(true);
  }

  return (
    <div className="paper-texture flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back home
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="heading-serif text-3xl text-foreground">
            {forgotSent ? "Check your email" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {forgotSent
              ? "If an account exists for that address, a reset link is on its way."
              : "A quiet space for everything you've been meaning to do."}
          </p>

          {awaitingConfirmation ? (
            <div className="mt-6 rounded-xl border border-border bg-secondary/50 p-4 text-sm text-foreground">
              Almost there. We've sent you a confirmation email — click the link to
              confirm your account, then sign in here.
            </div>
          ) : forgotSent ? (
            <div className="mt-6">
              <Button
                variant="ghost"
                onClick={() => setForgotSent(false)}
                className="text-muted-foreground"
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="signin" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-6">
                <AuthForm mode="signin" loading={loading} onSubmit={handleSignIn} />
                <button
                  type="button"
                  onClick={() => setForgotSent(true)}
                  className="mt-4 text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </button>
              </TabsContent>
              <TabsContent value="signup" className="mt-6">
                <AuthForm mode="signup" loading={loading} onSubmit={handleSignUp} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

function AuthForm({
  mode,
  loading,
  onSubmit,
}: {
  mode: "signin" | "signup";
  loading: boolean;
  onSubmit: (email: string, password: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(email, password);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
      </Button>
    </form>
  );
}
