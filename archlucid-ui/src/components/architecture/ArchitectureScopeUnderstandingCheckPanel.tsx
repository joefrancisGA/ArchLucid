"use client";

import { ArchitectureScopeUnderstandingRow } from "@/components/architecture/ArchitectureScopeUnderstandingRow";
import type { ArchitectureDraftSaveState } from "@/hooks/use-architecture-draft-autosave";
import {
  SCOPE_CONTEXT_SOURCE_DEFAULT_LABEL,
  SCOPE_UNDERSTANDING_HEADING,
  SCOPE_UNDERSTANDING_HELPER,
  type DeriveScopeUnderstandingBulletsInput,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { Dispatch, SetStateAction } from "react";

import { ArchitectureScopeUnderstandingAddRow } from "./ArchitectureScopeUnderstandingAddRow";
import { ArchitectureScopeUnderstandingConfirmBar } from "./ArchitectureScopeUnderstandingConfirmBar";
import { useArchitectureScopeUnderstandingCheck } from "./use-architecture-scope-understanding-check";

export type ArchitectureScopeUnderstandingCheckPanelProps = {
  readonly input: DeriveScopeUnderstandingBulletsInput;
  readonly disabled?: boolean;
  /** Names the field that owns the architecture context text on this surface, for the read-only row hint. */
  readonly contextSourceLabel?: string;
  /** What confirmation unblocks on this surface — starting the review, or continuing the wizard. */
  readonly readyHint?: string;
  /** When false, omit the ready line — use when a primary CTA below already signals the next step. */
  readonly showReadyHint?: boolean;
  /** Draft persistence on architecture draft surfaces — suppresses the ready line while save is in flight. */
  readonly draftSaveState?: ArchitectureDraftSaveState;
  /** Fingerprint of scope lines already saved on the draft — restores confirmation when unchanged. */
  readonly persistedScopeFingerprint?: string | null;
  /** Persists confirmed scope to the draft before opening the gate. */
  readonly onConfirm?: (bullets: ScopeUnderstandingBullet[]) => void | Promise<boolean>;
  /** Same-page anchor for the next workflow step after scope is confirmed (e.g. start review CTA). */
  readonly nextStepAnchorId?: string;
  readonly nextStepAnchorLabel?: string;
  readonly onBulletsChange?: Dispatch<SetStateAction<ScopeUnderstandingBullet[]>>;
  readonly onGateChange?: (gateOpen: boolean) => void;
};

/** TB-2176: typed in-scope rows with an explicit operator confirmation before execute. */
export function ArchitectureScopeUnderstandingCheckPanel(
  props: ArchitectureScopeUnderstandingCheckPanelProps,
): React.JSX.Element {
  const viewModel = useArchitectureScopeUnderstandingCheck({
    input: props.input,
    disabled: props.disabled,
    persistedScopeFingerprint: props.persistedScopeFingerprint,
    onConfirm: props.onConfirm,
    nextStepAnchorId: props.nextStepAnchorId,
    nextStepAnchorLabel: props.nextStepAnchorLabel,
    readyHint: props.readyHint,
    showReadyHint: props.showReadyHint,
    draftSaveState: props.draftSaveState,
    onBulletsChange: props.onBulletsChange,
    onGateChange: props.onGateChange,
  });

  const { bullets, editingAllowed, handleRowValueChange, handleRowRemove } = viewModel;

  return (
    <section
      className={cn(DESIGN_TOKENS.callout.neutral, OPERATOR_LAYOUT.cardPadding, OPERATOR_LAYOUT.sectionStack)}
      data-testid="architecture-scope-understanding-check"
      aria-labelledby="architecture-scope-understanding-heading"
    >
      <div className={OPERATOR_LAYOUT.sectionHeadingStack}>
        <h2
          id="architecture-scope-understanding-heading"
          className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {SCOPE_UNDERSTANDING_HEADING}
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {SCOPE_UNDERSTANDING_HELPER}
        </p>
      </div>

      <ul
        className={cn("m-0 list-none space-y-4 p-0", OPERATOR_TYPOGRAPHY.body)}
        data-testid="architecture-scope-understanding-bullets"
      >
        {bullets.map((bullet) => (
          <ArchitectureScopeUnderstandingRow
            key={bullet.id}
            bullet={bullet}
            disabled={!editingAllowed}
            contextSourceLabel={props.contextSourceLabel ?? SCOPE_CONTEXT_SOURCE_DEFAULT_LABEL}
            onValueChange={handleRowValueChange}
            onRemove={handleRowRemove}
          />
        ))}
      </ul>

      <ArchitectureScopeUnderstandingAddRow viewModel={viewModel} />

      <ArchitectureScopeUnderstandingConfirmBar viewModel={viewModel} />
    </section>
  );
}
