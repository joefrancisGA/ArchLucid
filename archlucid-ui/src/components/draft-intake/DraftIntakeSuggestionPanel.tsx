"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DraftIntakeActorSuggestionsGateDialog } from "@/components/draft-intake/DraftIntakeActorSuggestionsGateDialog";
import { Button } from "@/components/ui/button";
import { DismissControl } from "@/components/usability/DismissControl";
import { formatSuggestedActorLabel } from "@/lib/draft-intake-actor-labels";
import {
  actorIdentityKey,
  buildSuggestedActorsFromIntent,
  filterNewActorSuggestions,
  MIN_INTENT_CHARS_FOR_ACTOR_SUGGESTIONS,
} from "@/lib/draft-intake-actor-suggestions";
import {
  GUIDED_INTAKE_ACTORS_SECTION_HEADING,
  GUIDED_INTAKE_ADD_SELECTED_ACTORS_BUTTON,
  GUIDED_INTAKE_CREATION_PEOPLE_SYSTEMS_HINT,
  GUIDED_INTAKE_CREATION_SUGGEST_ACTORS_BUTTON,
  GUIDED_INTAKE_CREATION_SUGGEST_ACTORS_DISABLED_HINT,
  GUIDED_INTAKE_SUGGESTED_ACTORS_HEADING,
  GUIDED_INTAKE_SUGGEST_ACTORS_BUTTON,
  GUIDED_INTAKE_SUGGEST_ACTORS_DISABLED_HINT,
  GUIDED_INTAKE_TRUST_BOUNDARY_HINT,
} from "@/lib/guided-intake-copy";
import {
  OPERATOR_FORM_FIELD_HELPER_CLASS,
  OPERATOR_FORM_FIELD_LABEL_CLASS,
  OPERATOR_FORM_FIELD_STACK_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  draftIntakeActorGateConfirmHrefFromSearch,
  parseDraftIntakeActorGateConfirmOpenFromSearch,
} from "@/lib/draft-intake/draft-intake-actor-gate-confirm-url";
import type { ActorSet } from "@/types/draft-intake-actors";

type DraftIntakeSuggestionPanelProps = {
  readonly actorSet: ActorSet;
  readonly intentText: string;
  readonly minIntentChars?: number;
  readonly panelDisabled: boolean;
  readonly creationFlow?: boolean;
  readonly suggestionGateRequestId?: number;
  readonly onChange: (actorSet: ActorSet) => void;
  readonly onUnresolvedSuggestionsChange?: (unresolved: boolean) => void;
};

export function DraftIntakeSuggestionPanel(props: DraftIntakeSuggestionPanelProps) {
  const {
    actorSet,
    intentText,
    minIntentChars = MIN_INTENT_CHARS_FOR_ACTOR_SUGGESTIONS,
    panelDisabled,
    creationFlow = false,
    suggestionGateRequestId,
    onChange,
    onUnresolvedSuggestionsChange,
  } = props;

  const pathname = usePathname() ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const actorGateConfirmParam = searchParams.get("actorGateConfirm");
  const [suggestionPanelOpen, setSuggestionPanelOpen] = useState(false);
  const [suggestionGateOpen, setSuggestionGateOpenState] = useState(
    () => parseDraftIntakeActorGateConfirmOpenFromSearch(actorGateConfirmParam),
  );
  const [selectedSuggestionKeys, setSelectedSuggestionKeys] = useState<ReadonlySet<string>>(() => new Set());

  const syncActorGateToUrl = useCallback(
    (open: boolean) => {
      if (pathname.length === 0) {
        return;
      }

      router.replace(
        draftIntakeActorGateConfirmHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setSuggestionGateOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setSuggestionGateOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncActorGateToUrl(next);

        return next;
      });
    },
    [syncActorGateToUrl],
  );

  useEffect(() => {
    setSuggestionGateOpenState(parseDraftIntakeActorGateConfirmOpenFromSearch(actorGateConfirmParam));
  }, [actorGateConfirmParam]);

  const canSuggestFromIntent = intentText.trim().length >= minIntentChars;

  const pendingSuggestions = useMemo(() => {
    if (!suggestionPanelOpen) {
      return [];
    }

    return filterNewActorSuggestions(actorSet.actors, buildSuggestedActorsFromIntent(intentText));
  }, [actorSet.actors, intentText, suggestionPanelOpen]);

  useEffect(() => {
    if (!suggestionPanelOpen) {
      return;
    }

    document
      .querySelector("[data-testid='draft-intake-actor-suggestions-panel']")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [suggestionPanelOpen]);

  useEffect(() => {
    onUnresolvedSuggestionsChange?.(suggestionPanelOpen);
  }, [onUnresolvedSuggestionsChange, suggestionPanelOpen]);

  useEffect(() => {
    if (suggestionGateRequestId === undefined || suggestionGateRequestId === 0) {
      return;
    }

    if (!suggestionPanelOpen) {
      return;
    }

    setSuggestionGateOpen(true);
  }, [setSuggestionGateOpen, suggestionGateRequestId, suggestionPanelOpen]);

  function openSuggestionPanel(): void {
    const freshSuggestions = filterNewActorSuggestions(
      actorSet.actors,
      buildSuggestedActorsFromIntent(intentText),
    );

    setSelectedSuggestionKeys(new Set(freshSuggestions.map((actor) => actorIdentityKey(actor))));
    setSuggestionPanelOpen(true);
  }

  function toggleSuggestionSelection(key: string, checked: boolean): void {
    setSelectedSuggestionKeys((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }

      return next;
    });
  }

  function dismissSuggestionPanel(): void {
    setSuggestionPanelOpen(false);
    setSelectedSuggestionKeys(new Set());
    setSuggestionGateOpen(false);
  }

  function addSelectedSuggestions(): void {
    const selectedActors = pendingSuggestions.filter((actor) =>
      selectedSuggestionKeys.has(actorIdentityKey(actor)),
    );
    const newActors = filterNewActorSuggestions(actorSet.actors, selectedActors);

    if (newActors.length === 0) {
      return;
    }

    onChange({
      actors: [...actorSet.actors, ...newActors],
    });
    dismissSuggestionPanel();
  }

  const isCreationFlow = creationFlow === true;
  const sectionHint = isCreationFlow ? GUIDED_INTAKE_CREATION_PEOPLE_SYSTEMS_HINT : GUIDED_INTAKE_TRUST_BOUNDARY_HINT;
  const suggestActorsButtonLabel = isCreationFlow
    ? GUIDED_INTAKE_CREATION_SUGGEST_ACTORS_BUTTON
    : GUIDED_INTAKE_SUGGEST_ACTORS_BUTTON;
  const suggestActorsDisabledHint = isCreationFlow
    ? GUIDED_INTAKE_CREATION_SUGGEST_ACTORS_DISABLED_HINT
    : GUIDED_INTAKE_SUGGEST_ACTORS_DISABLED_HINT;

  return (
    <>
      <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={cn("m-0", OPERATOR_FORM_FIELD_LABEL_CLASS)}>
            {GUIDED_INTAKE_ACTORS_SECTION_HEADING}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={panelDisabled || !canSuggestFromIntent}
            data-testid="draft-intake-actor-suggest"
            onClick={() => {
              openSuggestionPanel();
            }}
          >
            {suggestActorsButtonLabel}
          </Button>
        </div>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_FORM_FIELD_HELPER_CLASS)}>
          {sectionHint}
        </p>
        {!canSuggestFromIntent ? (
          <p
            className={cn("m-0 text-neutral-500", OPERATOR_FORM_FIELD_HELPER_CLASS)}
            data-testid="draft-intake-actor-suggest-hint"
          >
            {suggestActorsDisabledHint}
          </p>
        ) : null}
      </div>

      {suggestionPanelOpen ? (
        <div
          className="space-y-3 rounded-md border border-dashed border-neutral-300 p-3 dark:border-neutral-700"
          data-testid="draft-intake-actor-suggestions-panel"
        >
          <p className={cn("m-0", OPERATOR_FORM_FIELD_LABEL_CLASS)}>
            {GUIDED_INTAKE_SUGGESTED_ACTORS_HEADING}
          </p>
          {pendingSuggestions.length === 0 ? (
            <p className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
              No new suggestions — add people or systems manually or edit the overview and try again.
            </p>
          ) : (
            <ul className="m-0 list-none space-y-2 p-0">
              {pendingSuggestions.map((actor) => {
                const key = actorIdentityKey(actor);

                return (
                  <li key={key}>
                    <label className={cn("flex cursor-pointer items-start gap-2", OPERATOR_TYPOGRAPHY.body)}>
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedSuggestionKeys.has(key)}
                        disabled={panelDisabled}
                        data-testid={`draft-intake-actor-suggestion-${key}`}
                        onChange={(event) => {
                          toggleSuggestionSelection(key, event.target.checked);
                        }}
                      />
                      <span>{formatSuggestedActorLabel(actor)}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="primary"
              disabled={panelDisabled || selectedSuggestionKeys.size === 0}
              data-testid="draft-intake-actor-add-selected"
              onClick={() => {
                addSelectedSuggestions();
              }}
            >
              {GUIDED_INTAKE_ADD_SELECTED_ACTORS_BUTTON}
            </Button>
            <DismissControl
              disabled={panelDisabled}
              data-testid="draft-intake-actor-dismiss-suggestions"
              onDismiss={() => {
                dismissSuggestionPanel();
              }}
            />
          </div>
        </div>
      ) : null}

      <DraftIntakeActorSuggestionsGateDialog
        open={suggestionGateOpen}
        onOpenChange={setSuggestionGateOpen}
        addSelectedDisabled={selectedSuggestionKeys.size === 0}
        panelDisabled={panelDisabled}
        onAddSelected={() => {
          addSelectedSuggestions();
        }}
        onDismissSuggestions={() => {
          dismissSuggestionPanel();
        }}
      />
    </>
  );
}
