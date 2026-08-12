"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { PolicyRulePlainEnglishDraftPanel } from "./PolicyRulePlainEnglishDraftPanel";
import {
  createEmptyCuratedRuleRow,
  CURATED_RULE_SEVERITIES,
  type CuratedFrameworkMappingRow,
  type CuratedRuleRow,
  type CuratedRulesDocument,
  type CuratedRuleSeverity,
  serializeCuratedRulesDocument,
} from "@/lib/policy/policy-pack-curated-rules-v1";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CuratedRulesAuthoringSectionProps = {
  readonly canMutatePacks: boolean;
  readonly curatedDoc: CuratedRulesDocument;
  readonly onCuratedDocChange: (next: CuratedRulesDocument) => void;
  readonly packName: string;
  readonly packDescription: string;
  readonly publishVersion: string;
  readonly packType: string;
  readonly highlightRuleId?: string;
};

function cloneRule(row: CuratedRuleRow): CuratedRuleRow {
  return {
    ...row,
    evidenceHints: [...row.evidenceHints],
    frameworkMappings: row.frameworkMappings.map((m) => ({ ...m })),
  };
}

export function CuratedRulesAuthoringSection(props: CuratedRulesAuthoringSectionProps) {
  const {
    canMutatePacks,
    curatedDoc,
    onCuratedDocChange,
    packName,
    packDescription,
    publishVersion,
    packType,
    highlightRuleId,
  } = props;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<CuratedRuleRow>(() => createEmptyCuratedRuleRow());

  const previewDoc: CuratedRulesDocument = useMemo(
    () => ({
      ...curatedDoc,
      pack: {
        ...curatedDoc.pack,
        name: packName.trim() || curatedDoc.pack.name,
        description: packDescription.trim() || curatedDoc.pack.description,
        version: publishVersion.trim() || curatedDoc.pack.version,
        suggestedPackType: packType.trim() || curatedDoc.pack.suggestedPackType,
      },
    }),
    [curatedDoc, packDescription, packName, packType, publishVersion],
  );

  const previewJson: string = useMemo(() => serializeCuratedRulesDocument(previewDoc), [previewDoc]);

  function openAdd(): void {
    setDraft(createEmptyCuratedRuleRow());
    setEditIndex(null);
    setDialogOpen(true);
  }

  function openEdit(index: number): void {
    const row = curatedDoc.rules[index];

    if (row === undefined) {
      return;
    }

    setDraft(cloneRule(row));
    setEditIndex(index);
    setDialogOpen(true);
  }

  function removeRule(index: number): void {
    const nextRules = curatedDoc.rules.filter((_, i) => i !== index);

    onCuratedDocChange({ ...curatedDoc, rules: nextRules });
  }

  function saveDraft(): void {
    if (editIndex === null) {
      onCuratedDocChange({ ...curatedDoc, rules: [...curatedDoc.rules, cloneRule(draft)] });
    } else {
      const next = [...curatedDoc.rules];
      next[editIndex] = cloneRule(draft);
      onCuratedDocChange({ ...curatedDoc, rules: next });
    }

    setDialogOpen(false);
  }

  function setDraftEvidenceHint(index: number, value: string): void {
    const hints = [...draft.evidenceHints];

    hints[index] = value;
    setDraft({ ...draft, evidenceHints: hints });
  }

  function addEvidenceHintRow(): void {
    setDraft({ ...draft, evidenceHints: [...draft.evidenceHints, ""] });
  }

  function removeEvidenceHintRow(index: number): void {
    setDraft({
      ...draft,
      evidenceHints: draft.evidenceHints.filter((_, i) => i !== index),
    });
  }

  function setDraftFrameworkRow(index: number, patch: Partial<CuratedFrameworkMappingRow>): void {
    const maps = draft.frameworkMappings.map((m, i) => (i === index ? { ...m, ...patch } : m));

    setDraft({ ...draft, frameworkMappings: maps });
  }

  function addFrameworkRow(): void {
    setDraft({
      ...draft,
      frameworkMappings: [...draft.frameworkMappings, { framework: "" }],
    });
  }

  function removeFrameworkRow(index: number): void {
    setDraft({
      ...draft,
      frameworkMappings: draft.frameworkMappings.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="space-y-3 rounded-md border border-neutral-200 dark:border-neutral-700 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Tenant curated compliance rules (v1)</p>
        <Button
          type="button"
          size="sm"
          data-testid="policy-curated-rules-add"
          onClick={() => openAdd()}
          disabled={!canMutatePacks}
          title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
        >
          Add rule
        </Button>
      </div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Form-based rows round-trip to metadata <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">pack.curatedRules.v1</code> and
        extend <span className="font-mono">complianceRuleKeys</span> on merge.
      </p>

      <PolicyRulePlainEnglishDraftPanel
        canMutatePacks={canMutatePacks}
        curatedDoc={curatedDoc}
        onCuratedDocChange={onCuratedDocChange}
      />

      {curatedDoc.rules.length === 0 ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No curated rules yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className={cn("w-full border-collapse", OPERATOR_TYPOGRAPHY.body)}>
            <thead>
              <tr className={cn("border-b border-neutral-200 text-left dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
                <th className="py-2 pr-2 font-medium">Id</th>
                <th className="py-2 pr-2 font-medium">Title</th>
                <th className="py-2 pr-2 font-medium">Severity</th>
                <th className="py-2 pr-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {curatedDoc.rules.map((r, index) => (
                <tr
                  key={`${r.id}-${index}`}
                  data-rule-id={r.id}
                  className={cn(
                    "border-b border-neutral-100 dark:border-neutral-800",
                    highlightRuleId !== undefined &&
                      highlightRuleId.trim().length > 0 &&
                      r.id.trim().toLowerCase() === highlightRuleId.trim().toLowerCase()
                      ? "bg-[var(--al-layer-hover)] ring-2 ring-amber-600/50 ring-inset dark:bg-neutral-800/80 dark:ring-amber-700/50"
                      : undefined,
                  )}
                >
                  <td className={cn("py-1 pr-2 align-top font-mono", OPERATOR_TYPOGRAPHY.micro)}>{r.id}</td>
                  <td className="py-1 pr-2 align-top">{r.title}</td>
                  <td className="py-1 pr-2 align-top">{r.severity}</td>
                  <td className="py-1 pr-2 align-top text-right whitespace-nowrap">
                    <Button
                      type="button"
                      size="sm"
                      data-testid={`policy-curated-rule-edit-${r.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`}
                      variant="secondary"
                      onClick={() => openEdit(index)}
                      disabled={!canMutatePacks}
                      title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
                    >
                      Edit
                    </Button>{" "}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => removeRule(index)}
                      disabled={!canMutatePacks}
                      title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="curated-rules-json-preview" className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Read-only curated-rules JSON preview
        </label>
        <Textarea
          id="curated-rules-json-preview"
          data-testid="policy-curated-rules-json-preview"
          value={previewJson}
          readOnly
          rows={10}
          className={cn("bg-neutral-50 font-mono dark:bg-neutral-900", OPERATOR_TYPOGRAPHY.micro)}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editIndex === null ? "Add curated rule" : "Edit curated rule"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <div className="space-y-1">
              <label htmlFor="curated-edit-id" className={cn("font-medium", OPERATOR_TYPOGRAPHY.helper)}>
                Rule id
              </label>
              <Input
                id="curated-edit-id"
                value={draft.id}
                onChange={(e) => setDraft({ ...draft, id: e.target.value })}
                className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="curated-edit-title" className={cn("font-medium", OPERATOR_TYPOGRAPHY.helper)}>
                Title
              </label>
              <Input id="curated-edit-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label htmlFor="curated-edit-desc" className={cn("font-medium", OPERATOR_TYPOGRAPHY.helper)}>
                Description
              </label>
              <Textarea
                id="curated-edit-desc"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={3}
                className={OPERATOR_TYPOGRAPHY.micro}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="curated-edit-severity" className={cn("font-medium", OPERATOR_TYPOGRAPHY.helper)}>
                Severity
              </label>
              <select
                id="curated-edit-severity"
                value={draft.severity}
                onChange={(e) => setDraft({ ...draft, severity: e.target.value as CuratedRuleSeverity })}
                className={cn("block w-full rounded-md border border-neutral-200 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.body)}
              >
                {CURATED_RULE_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="curated-edit-remediation" className={cn("font-medium", OPERATOR_TYPOGRAPHY.helper)}>
                Remediation guidance
              </label>
              <Textarea
                id="curated-edit-remediation"
                value={draft.remediationGuidance}
                onChange={(e) => setDraft({ ...draft, remediationGuidance: e.target.value })}
                rows={2}
                className={OPERATOR_TYPOGRAPHY.micro}
              />
            </div>
            <div className="space-y-1">
              <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.helper)}>Evidence hints</span>
              <div className="flex flex-col gap-1">
                {draft.evidenceHints.map((hint, idx) => (
                  <div key={`h-${idx}`} className="flex gap-1">
                    <Input
                      value={hint}
                      onChange={(e) => setDraftEvidenceHint(idx, e.target.value)}
                      className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}
                    />
                    <Button type="button" size="sm" variant="secondary" onClick={() => removeEvidenceHintRow(idx)}>
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="secondary" onClick={() => addEvidenceHintRow()}>
                  Add evidence hint
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <span className={cn("font-medium", OPERATOR_TYPOGRAPHY.helper)}>Framework mappings</span>
              <div className="flex flex-col gap-2">
                {draft.frameworkMappings.map((m, idx) => (
                  <div key={`m-${idx}`} className="grid gap-1 sm:grid-cols-3 rounded border border-neutral-100 dark:border-neutral-800 p-2">
                    <Input
                      placeholder="Framework"
                      value={m.framework}
                      onChange={(e) => setDraftFrameworkRow(idx, { framework: e.target.value })}
                      className={OPERATOR_TYPOGRAPHY.micro}
                    />
                    <Input
                      placeholder="Control (optional)"
                      value={m.control ?? ""}
                      onChange={(e) => setDraftFrameworkRow(idx, { control: e.target.value })}
                      className={OPERATOR_TYPOGRAPHY.micro}
                    />
                    <div className="flex gap-1 items-center">
                      <Input
                        placeholder="Requirement (optional)"
                        value={m.requirement ?? ""}
                        onChange={(e) => setDraftFrameworkRow(idx, { requirement: e.target.value })}
                        className={OPERATOR_TYPOGRAPHY.micro}
                      />
                      <Button type="button" size="sm" variant="secondary" onClick={() => removeFrameworkRow(idx)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" size="sm" variant="secondary" onClick={() => addFrameworkRow()}>
                  Add framework row
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              data-testid="policy-curated-rule-save"
              onClick={() => saveDraft()}
              disabled={!canMutatePacks}
              title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
            >
              Save rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
