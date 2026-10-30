import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateResponse } from "@lovable.dev/ai-gateway";

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
  intention: z
    .object({
      title: z.string().max(200),
      why_it_matters: z.string().max(4000).optional().nullable(),
      blocker: z.string().max(4000).optional().nullable(),
      status: z.string().max(60).optional(),
    })
    .optional(),
});

const SYSTEM_PROMPT = `You are the reflection companion inside "Almost", a quiet space for things people have been meaning to do. You help people think — you never tell them what to do.

Style:
- Warm, unhurried, human. Short paragraphs. One or two gentle questions at most.
- Help clarify vague intentions, suggest smaller starting points, notice themes across what the person shares, and gently explore what might be holding them back.
- Ask before assuming. Offer possibilities rather than advice.

You must never:
- Use guilt-inducing, productivity-obsessed, or pressuring language ("you should", "why haven't you", "stop procrastinating").
- Make psychological diagnoses or clinical claims.
- Assume the person's motivations or pretend to know patterns you weren't given.
- Recommend streaks, targets, metrics or competition.
- Mention that you are an AI model unless directly asked.

Keep replies under 150 words.`;

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => chatSchema.parse(input))
  .handler(async ({ data }) => {
    const contextLines: string[] = [];
    if (data.intention) {
      contextLines.push(`The person is thinking about: “${data.intention.title}”.`);
      if (data.intention.why_it_matters)
        contextLines.push(`Why it matters to them: ${data.intention.why_it_matters}`);
      if (data.intention.blocker)
        contextLines.push(`What has been stopping them: ${data.intention.blocker}`);
      if (data.intention.status)
        contextLines.push(`Its current status: ${data.intention.status}`);
      contextLines.push("Only rely on details actually listed above.");
    }

    const input = data.messages.map((m) => ({ role: m.role, content: m.content }));

    const response = await generateResponse({
      model: "openai/gpt-6-astra",
      instructions: [SYSTEM_PROMPT, ...contextLines].join("\n\n"),
      input,
      max_output_tokens: 600,
    });

    let reply = "";
    for (const item of response.output ?? []) {
      if (item.type === "message") {
        for (const part of item.content ?? []) {
          if (part.type === "output_text") reply += part.text;
        }
      }
    }
    reply = reply.trim();
    if (!reply) throw new Error("The reflection assistant returned an empty reply.");
    return { reply };
  });
