import { createFileRoute } from "@tanstack/react-router";
import { Mic, MicOff, MessageSquareText } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/voice")({
  head: () => ({
    meta: [
      { title: "AI Voice Assistant — DukaanSaathi AI" },
      {
        name: "description",
        content: "Run your shop by voice — under development in DukaanSaathi AI.",
      },
      { property: "og:title", content: "AI Voice Assistant — DukaanSaathi AI" },
      {
        property: "og:description",
        content: "Run your shop by voice — under development in DukaanSaathi AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VoicePage,
});

const SUPPORTED_LANGUAGES = [
  { value: "hi-in", label: "Hindi" },
  { value: "en-in", label: "English" },
  { value: "hi-en", label: "Hinglish (Hindi + English)" },
];

const PLANNED_COMMANDS = [
  "“Sold 2 packets of Parle-G” — record a sale after you confirm",
  "“How much atta is left?” — hear the current stock level",
  "“Add 12 packets of Maggi” — increase stock after you confirm",
];

function VoicePage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <PageHeader
        title="AI Voice Assistant"
        description="Speak your sales and stock updates instead of typing them — designed for busy counters."
      />

      <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
        <p className="font-medium text-warning">Voice processing is not connected yet</p>
        <p className="mt-1 text-sm text-foreground/80">
          The microphone stays off until speech recognition and the command engine are wired to your
          shop data. Nothing you say is recorded or acted on right now.
        </p>
      </div>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className="relative flex size-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <MicOff className="size-8" />
            <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border bg-card text-warning">
              <Mic className="size-3.5" />
            </span>
          </span>
          <div>
            <p className="font-medium">Microphone is off</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              When connected, you'll press the mic, speak a command, and confirm before anything
              changes in your shop.
            </p>
          </div>
          <Button disabled className="mt-1">
            <Mic className="size-4" /> Start listening
          </Button>
          <div className="w-full max-w-xs">
            <Select disabled defaultValue="hi-in">
              <SelectTrigger aria-label="Assistant language">
                <SelectValue placeholder="Choose language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <MessageSquareText className="size-4 text-primary" /> Command history
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No commands yet — the assistant is not connected to your shop data, so this history is
          empty on purpose.
        </p>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="font-display text-base font-semibold">Planned voice commands</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {PLANNED_COMMANDS.map((c) => (
            <li key={c} className="rounded-lg border bg-background/50 px-3 py-2">
              {c}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
