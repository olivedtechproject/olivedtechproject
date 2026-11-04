import { useState } from "react";
import {
  Sparkles,
  HeartHandshake,
  Brain,
  MessageSquare,
  Copy,
  Check,
  RotateCw,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getConflictAdvice, type ConflictAdviceResponse } from "@/lib/conflictAdvice";
import { gatherUserSiteHistory } from "@/lib/userSiteHistory";

interface Props {
  title: string;
  body: string;
  nickname?: string;
  defaultExpanded?: boolean;
  onAdviceGenerated?: (advice: ConflictAdviceResponse) => void;
}

export function AiConflictSuggestion({
  title,
  body,
  nickname,
  defaultExpanded = false,
  onAdviceGenerated,
}: Props) {
  const [advice, setAdvice] = useState<ConflictAdviceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  async function generate() {
    if (title.trim().length < 3 || body.trim().length < 10) {
      toast.error(
        "Please add a title and a bit more detail to your story first so the AI can understand the conflict.",
      );
      return;
    }

    setLoading(true);
    setIsExpanded(true);
    try {
      const userContext = gatherUserSiteHistory(nickname);
      const res = await getConflictAdvice({
        data: {
          title: title.trim(),
          body: body.trim(),
          userContext,
        },
      });

      setAdvice(res);
      onAdviceGenerated?.(res);
      toast.success("AI conflict & emotional regulation advice ready!");
    } catch (err) {
      console.error(err);
      toast.error("Could not generate advice right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    if (!advice) return;
    const lines = [
      `Olive AI Conflict Resolution Advice: "${title}"`,
      "",
      `Perspective Check:`,
      advice.perspectiveCheck,
      "",
      `Emotional Regulation Steps:`,
      ...advice.emotionalRegulationSteps.map((s, i) => `${i + 1}. ${s.step}: ${s.detail}`),
      "",
      `Conflict Resolution Plan:`,
      ...advice.conflictResolutionPlan.map(
        (p, i) =>
          `${i + 1}. ${p.action}: ${p.detail}${p.exampleScript ? `\n   Script: ${p.exampleScript}` : ""}`,
      ),
      "",
      advice.personalizedNote ? `Note: ${advice.personalizedNote}` : "",
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    toast.success("Advice copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              Optional AI Conflict Advice & Emotional Regulation
            </h4>
            <p className="text-xs text-muted-foreground">
              Get customized real-world next steps and calming guidance tailored to this situation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!advice ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={loading}
              onClick={generate}
              className="rounded-full gap-1.5 text-xs font-bold shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Sparkles className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Reflecting on conflict…" : "Get AI Advice"}</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 rounded-full text-xs text-muted-foreground hover:text-foreground gap-1 px-2.5"
                title="Copy advice to notes"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={generate}
                className="h-8 rounded-full text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                title="Re-generate advice"
              >
                <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span className="sr-only sm:not-sr-only">Re-run</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 rounded-full text-xs text-muted-foreground hover:text-foreground px-2"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-card/60 p-6 text-sm text-muted-foreground border border-border/60">
          <Sparkles className="h-4 w-4 animate-spin text-primary" />
          <span>Analyzing conflict dynamics and preparing calming steps…</span>
        </div>
      )}

      {advice && isExpanded && (
        <div className="mt-4 space-y-4 border-t border-primary/20 pt-4 text-sm animate-in fade-in duration-300">
          {/* Headline & Perspective Check */}
          <div className="rounded-xl border border-primary/20 bg-card/90 p-4 shadow-2xs">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Brain className="h-3.5 w-3.5" />
              <span>Perspective & Reality Check</span>
            </div>
            <p className="mt-1.5 font-bold text-foreground text-base leading-snug">
              {advice.headline}
            </p>
            <p className="mt-2 text-muted-foreground leading-relaxed text-xs sm:text-sm">
              {advice.perspectiveCheck}
            </p>
          </div>

          {/* Emotional Regulation Steps */}
          <div className="rounded-xl border border-border bg-card/90 p-4 shadow-2xs">
            <div className="flex items-center gap-2 text-navy font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-navy" />
              <span>Immediate Emotional Regulation (Do This First)</span>
            </div>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
              {advice.emotionalRegulationSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border/80 bg-muted/40 p-3 flex flex-col justify-between"
                >
                  <p className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-navy text-[10px] font-extrabold text-navy-foreground">
                      {idx + 1}
                    </span>
                    <span>{step.step}</span>
                  </p>
                  <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Conflict Resolution Plan */}
          <div className="rounded-xl border border-border bg-card/90 p-4 shadow-2xs">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <HeartHandshake className="h-3.5 w-3.5" />
              <span>Conflict Resolution Next Steps (What To Say & Do)</span>
            </div>
            <div className="mt-3 space-y-3">
              {advice.conflictResolutionPlan.map((plan, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs sm:text-sm"
                >
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{plan.action}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground leading-relaxed text-xs">
                    {plan.detail}
                  </p>
                  {plan.exampleScript && (
                    <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-xs text-foreground">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-primary mb-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>Example words / text you can use:</span>
                      </div>
                      <p className="italic font-medium text-foreground/90">{plan.exampleScript}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Personalized Insight Note */}
          {advice.personalizedNote && (
            <p className="rounded-lg bg-secondary/60 px-3.5 py-2 text-xs italic text-secondary-foreground border border-border">
              🌿 <strong className="font-semibold not-italic">Olive Note:</strong>{" "}
              {advice.personalizedNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
