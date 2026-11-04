import type * as React from "react";
import { SlidersHorizontal, Trash2, RotateCcw, Sparkles, X, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { useAccountAlgorithm } from "@/lib/feedAlgorithm";

interface Props {
  algo: ReturnType<typeof useAccountAlgorithm>;
  nickname?: string;
  trigger?: React.ReactNode;
}

export function AlgorithmPreferencesDialog({ algo, nickname, trigger }: Props) {
  const { preferences, removeExcludedContext, restoreStory, resetAllExclusions } = algo;
  const hasExclusions =
    preferences.excludedContexts.length > 0 ||
    preferences.excludedStoryIds.length > 0 ||
    preferences.excludedFeedbackIds.length > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-1.5 rounded-full text-xs font-semibold"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Feed Algorithm Preferences</span>
            {hasExclusions && (
              <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {preferences.excludedContexts.length + preferences.excludedStoryIds.length}
              </span>
            )}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <DialogTitle className="text-xl font-bold">Your Feed Algorithm</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            Olive replaces negative public downvoting with smart account personalization. When you
            dislike a story or response, our algorithm learns which contexts to exclude from your
            feed in the future.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {/* Excluded Context Topics */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Excluded Context Topics ({preferences.excludedContexts.length})
            </h4>
            {preferences.excludedContexts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic bg-muted/40 rounded-xl p-3">
                No context topics are currently excluded. Click the downvote / exclude button on any
                story to filter that topic.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {preferences.excludedContexts.map((ctx) => (
                  <Badge
                    key={ctx}
                    variant="secondary"
                    className="flex items-center gap-1.5 py-1 px-3 text-xs font-medium rounded-full bg-muted hover:bg-muted/80 text-foreground"
                  >
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                    <span>{ctx}</span>
                    <button
                      type="button"
                      aria-label={`Unexclude ${ctx}`}
                      onClick={() => removeExcludedContext(ctx)}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Specifically Excluded Stories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Individually Excluded Stories ({preferences.excludedStoryIds.length})
            </h4>
            {preferences.excludedStoryIds.length === 0 ? (
              <p className="text-sm text-muted-foreground italic bg-muted/40 rounded-xl p-3">
                No specific stories have been individually excluded.
              </p>
            ) : (
              <div className="space-y-2">
                {preferences.log
                  .filter((entry) => entry.targetType === "story")
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm shadow-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">
                          {entry.title || "Untitled story"}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          "{entry.snippet}…"
                        </p>
                        {entry.detectedContexts.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {entry.detectedContexts.map((c) => (
                              <span
                                key={c}
                                className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => restoreStory(entry.targetId)}
                        className="shrink-0 h-8 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 rounded-lg inline-flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Restore</span>
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Account Indicator */}
          <div className="rounded-xl bg-primary/5 border border-primary/15 p-3 text-xs text-muted-foreground flex items-center justify-between">
            <span>
              Preferences saved for:{" "}
              <strong className="text-foreground">
                {nickname ? `@${nickname}` : "Guest session (this device)"}
              </strong>
            </span>
            {hasExclusions && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetAllExclusions}
                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg inline-flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                <span>Reset all</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
