"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_NAV_GROUP_LABEL } from "@/lib/design-tokens";

import type { ReactElement } from "react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WizardFieldError } from "@/components/wizard/WizardFieldError";
import { WizardFieldHint } from "@/components/wizard/WizardFieldHint";
import { useWizardAiSuggestedFields, type WizardAiSuggestedFieldName } from "@/lib/wizard-ai-suggested-fields";
import type { WizardFormValues } from "@/lib/wizard-schema";

export type WizardAdvancedStringListName = "policyReferences" | "topologyHints" | "securityBaselineHints";

export function WizardAdvancedChipList(props: {
  fieldName: WizardAdvancedStringListName;
  title: string;
  hint: string;
  inputId: string;
}): ReactElement {
  const { watch, setValue, formState, clearErrors } = useFormContext<WizardFormValues>();
  const { isAiSuggested, clearAiSuggested } = useWizardAiSuggestedFields();
  const { errors } = formState;
  const items: string[] = watch(props.fieldName) ?? [];
  const [draft, setDraft] = useState("");
  const listErr = errors[props.fieldName]?.message;

  const addItem = () => {
    const trimmed = draft.trim();

    if (!trimmed) {
      return;
    }

    clearErrors(props.fieldName);
    setValue(props.fieldName, [...items, trimmed], { shouldValidate: true, shouldDirty: true });
    setDraft("");
  };

  const removeItem = (index: number) => {
    clearAiSuggested(props.fieldName as WizardAiSuggestedFieldName, items[index] ?? "");
    clearErrors(props.fieldName);
    setValue(
      props.fieldName,
      items.filter((_, idx) => idx !== index),
      { shouldValidate: true, shouldDirty: true },
    );
  };

  return (
    <div className="space-y-2">
      <WizardFieldHint htmlFor={props.inputId} label={props.title} hint={props.hint} />
      <div className="flex flex-wrap gap-2">
        <Input
          id={props.inputId}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            clearErrors(props.fieldName);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          className="max-w-md flex-1 min-w-[12rem]"
        />
        <Button type="button" variant="secondary" onClick={addItem}>
          Add
        </Button>
      </div>
      <WizardFieldError
        id={`err-wizard-adv-${props.fieldName}`}
        message={listErr != null ? String(listErr) : undefined}
      />
      {items.length > 0 ? (
        <ul className="m-0 flex flex-wrap gap-2 p-0 list-none">
          {items.map((item, index) => (
            <li key={`${props.fieldName}-${index}`}>
              <Badge variant="outline" className="gap-1 py-1 pl-2 pr-1 font-normal">
                <span className="max-w-[220px] truncate">{item}</span>
                {isAiSuggested(props.fieldName as WizardAiSuggestedFieldName, item) ? (
                  <span className={cn("rounded bg-violet-100 px-1 font-semibold uppercase tracking-wide text-violet-900 dark:bg-violet-950 dark:text-violet-100", OPERATOR_NAV_GROUP_LABEL)}>
                    AI
                  </span>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-1"
                  onClick={() => removeItem(index)}
                  aria-label={`Remove ${item}`}
                >
                  ×
                </Button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
