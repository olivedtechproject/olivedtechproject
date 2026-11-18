import {
  AlertTriangle,
  CheckCircle2,
  LifeBuoy,
  ShieldAlert,
  ShieldCheck,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AiModerationResult } from "@/lib/aiModerator";

interface AiModeratorFeedbackProps {
  result?: AiModerationResult | null;
  error?: string | null;
  onApplyRewrite?: (rewrite: string) => void;
  onDismiss?: () => void;
}

export function AiModeratorFeedback({
  result,
  error,
  onApplyRewrite,
  onDismiss,
}: AiModeratorFeedbackProps) {
  if (!result && !error) return null;

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4 text-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <p className="font-bold text-foreground">AI Safety Moderator Notice</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{error}</p>
            </div>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss AI Moderator notice"
              className="rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!result) return null;

  if (result.crisisAlert || result.safetyLevel === "crisis") {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <LifeBuoy className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-bold text-foreground">
                AI Safety Moderator: Support Resources Available
              </p>
              <p className="mt-1 text-foreground/90">{result.summary}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {result.guidance}
              </p>
              <div className="mt-3 rounded-lg border border-destructive/25 bg-card p-3 text-xs leading-relaxed text-foreground">
                <p className="font-bold">If you or someone you know is in danger or hurting:</p>
                <ul className="mt-1.5 space-y-1">
                  <li>
                    • <strong>Call or text 988</strong> (Suicide &amp; Crisis Lifeline, free &amp;
                    confidential 24/7 in the US &amp; Canada)
                  </li>
                  <li>
                    • <strong>Text HOME to 741741</strong> (Crisis Text Line)
                  </li>
                  <li>• Reach out to a trusted adult, parent, school counselor, or teacher.</li>
                </ul>
              </div>
            </div>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss safety notice"
              className="rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  const isSafe = result.decision === "approve";
  const isBlocked = result.decision === "block";

  const containerStyle = isSafe
    ? "border-primary/35 bg-primary/10"
    : isBlocked
      ? "border-destructive/40 bg-destructive/10"
      : "border-amber-500/35 bg-amber-500/10";

  const Icon = isSafe ? ShieldCheck : isBlocked ? ShieldAlert : AlertTriangle;
  const iconColor = isSafe ? "text-primary" : isBlocked ? "text-destructive" : "text-amber-700";

  const headingLabel = isSafe
    ? "AI Moderator: Passed Safety Check"
    : isBlocked
      ? "AI Moderator: Blocked for Safety"
      : "AI Moderator: Suggested Revision";

  return (
    <div role="status" className={`rounded-xl border p-4 text-sm ${containerStyle}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
          <div className="space-y-1.5">
            <p className="font-bold text-foreground">{headingLabel}</p>
            <p className="text-foreground/90">{result.summary}</p>
            {result.flags.length > 0 && (
              <p className="text-xs font-semibold text-muted-foreground">
                Flagged: {result.flags.join(" · ")}
              </p>
            )}
            <p className="text-xs leading-relaxed text-muted-foreground">{result.guidance}</p>

            {result.suggestedRewrite && (
              <div className="mt-2 rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-bold text-navy">
                  {result.flags.includes("No real human names allowed")
                    ? "Suggested anonymized wording (names removed):"
                    : "Suggested safer wording:"}
                </p>
                <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-foreground">
                  {result.suggestedRewrite}
                </p>
                {onApplyRewrite && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onApplyRewrite(result.suggestedRewrite!)}
                    className="mt-2.5 gap-1.5 rounded-lg text-xs font-bold"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    <span>
                      {result.flags.includes("No real human names allowed")
                        ? "Anonymize names automatically"
                        : "Use safer wording"}
                    </span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isSafe && <CheckCircle2 className="h-4 w-4 text-primary" />}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss AI Moderator result"
              className="rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
