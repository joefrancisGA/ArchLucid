import {
  PEOPLE_AND_SYSTEMS_OMITTED_SCOPE_VALUE,
  SCOPE_CONTEXT_PREVIEW_MAX_LENGTH,
  scopeBulletBehavior,
  stripScopeUnderstandingSection,
} from "./architecture-scope-understanding-shared";
import {
  formatStoredTextPreview,
  STORED_TEXT_PREVIEW_CONTINUATION,
} from "@/lib/format-stored-text-preview";
import type {
  DeriveScopeUnderstandingBulletsInput,
  ReconcileScopeUnderstandingBulletsInput,
  ScopeActorInput,
  ScopeUnderstandingBullet,
  ScopeUnderstandingBulletKind,
} from "./architecture-scope-understanding-shared";

export const ACTOR_SCOPE_DISPLAY_NAME_NOT_STORED = "Actor name was not stored." as const;

export const PEOPLE_IN_SCOPE_STORED_EMPTY = "People in scope were stored empty." as const;

export const SYSTEMS_IN_SCOPE_STORED_EMPTY = "Systems in scope were stored empty." as const;

export const SCOPE_BRIEF_INFERRED_LINE_PREFIX =
  "Derived from intake, not a separate confirmed answer: " as const;

/** Labels each actor for scope mirroring — never substitutes kind for a missing name. */
export function actorScopeDisplayLabel(actor: ScopeActorInput): string {
  const trimmedLabel = actor.label?.trim() ?? "";

  if (trimmedLabel.length > 0) {
    return trimmedLabel;
  }

  const kind = actor.kind.trim();

  if (kind.length === 0) {
    return ACTOR_SCOPE_DISPLAY_NAME_NOT_STORED;
  }

  const trustOrigin = actor.trustOrigin?.trim() ?? "";

  if (trustOrigin.length > 0 && trustOrigin !== "Internal") {
    return `Actor name was not stored (${kind}; ${trustOrigin}).`;
  }

  return `Actor name was not stored (${kind}).`;
}

/** Confirmed-scope line shown on guided intake confirm — prefixes inferred rows. */
export function scopeBriefLineDisplay(bullet: ScopeUnderstandingBullet): string {
  const line = scopeBulletText(bullet);

  if (bullet.source === "inferred") {
    return `${SCOPE_BRIEF_INFERRED_LINE_PREFIX}${line}`;
  }

  return line;
}

const SCOPE_NAME_LIST_VISIBLE_LIMIT = 4;

function formatScopeNameListLine(names: readonly string[]): string {
  if (names.length === 0) {
    return "";
  }

  const visible = names.slice(0, SCOPE_NAME_LIST_VISIBLE_LIMIT);
  const line = visible.join(", ");
  const remaining = names.length - visible.length;

  if (remaining <= 0) {
    return line;
  }

  const remainderCopy =
    remaining === 1
      ? "1 more name was stored and is not in this line."
      : `${remaining} more names were stored and are not in this line.`;

  return `${line}. ${remainderCopy}`;
}

function uniqueScopeLabels(labels: readonly string[]): string[] {
  const seen = new Set<string>();
  const uniqueLabels: string[] = [];

  for (const label of labels) {
    const trimmed = label.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const key = trimmed.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueLabels.push(trimmed);
  }

  return uniqueLabels;
}

function isScopeMirroredFromActorsRow(kind: ScopeUnderstandingBulletKind): boolean {
  return kind === "people" || kind === "systems" || kind === "context";
}

export const INFERRED_SCOPE_BULLET_PREFIX =
  "Inferred from the brief, not separately confirmed:" as const;

/** Flattens a typed row back to the `Label: value` line used in brief fingerprints and deduplication. */
export function scopeBulletText(bullet: ScopeUnderstandingBullet): string {
  const value = bullet.value.trim();

  return bullet.label.length === 0 ? value : `${bullet.label}: ${value}`;
}

function pushUniqueBullet(
  bullets: ScopeUnderstandingBullet[],
  kind: ScopeUnderstandingBulletKind,
  id: string,
  value: string,
): void {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return;
  }

  const candidate: ScopeUnderstandingBullet = {
    id,
    kind,
    label: scopeBulletBehavior(kind).label,
    value: trimmed,
    source: "inferred",
  };
  const duplicate = bullets.some(
    (bullet) => scopeBulletText(bullet).toLowerCase() === scopeBulletText(candidate).toLowerCase(),
  );

  if (duplicate) {
    return;
  }

  bullets.push(candidate);
}

/** Stable per-row id so operator edits survive re-derivation when the form above changes. */
function gapBulletIdSuffix(label: string): string {
  return Array.from(label, (character) => character.codePointAt(0)?.toString(16) ?? "")
    .filter((part) => part.length > 0)
    .join("-");
}

function gapBulletId(label: string): string {
  const normalizedLabel = label.trim().toLowerCase();
  const slug = normalizedLabel
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  const readableSegment = slug.length > 0 ? slug : "item";
  const uniqueSuffix = gapBulletIdSuffix(normalizedLabel);

  return uniqueSuffix.length > 0
    ? `gap-${readableSegment}-${uniqueSuffix}`
    : `gap-${readableSegment}`;
}

/** Derives typed in-scope rows from intake / create-home context (TB-2176). */
export function deriveScopeUnderstandingBullets(
  input: DeriveScopeUnderstandingBulletsInput,
): ScopeUnderstandingBullet[] {
  const bullets: ScopeUnderstandingBullet[] = [];
  const architectureName = input.architectureName?.trim() ?? input.systemName?.trim() ?? "";

  pushUniqueBullet(bullets, "system", "system", architectureName);

  const outcome = stripScopeUnderstandingSection(input.businessOutcome).trim();

  pushUniqueBullet(bullets, "outcome", "outcome", outcome);

  const overview = stripScopeUnderstandingSection(
    input.architectureOverview ?? input.intentText,
  ).trim();

  if (overview.length > 0) {
    const excerpt =
      overview.length > SCOPE_CONTEXT_PREVIEW_MAX_LENGTH
        ? formatStoredTextPreview(overview, SCOPE_CONTEXT_PREVIEW_MAX_LENGTH, STORED_TEXT_PREVIEW_CONTINUATION.scopeOverview)
        : overview;

    pushUniqueBullet(bullets, "context", "context", excerpt);
  }

  const peopleAndSystemsOmitted = input.peopleAndSystems === undefined;
  const peopleSource = input.peopleAndSystems ?? [];
  const people = uniqueScopeLabels(
    peopleSource
      .filter((entry) => entry.kind === "Human" || entry.kind === "Both")
      .map((entry) => actorScopeDisplayLabel(entry)),
  );
  const systems = uniqueScopeLabels(
    peopleSource
      .filter((entry) => entry.kind === "Machine" || entry.kind === "Both")
      .map((entry) => actorScopeDisplayLabel(entry)),
  );
  const hasScopeAnchor =
    architectureName.length > 0 ||
    outcome.length > 0 ||
    overview.length > 0 ||
    (input.missingItemLabels?.length ?? 0) > 0;

  if (peopleAndSystemsOmitted && hasScopeAnchor) {
    pushUniqueBullet(bullets, "people", "people", PEOPLE_AND_SYSTEMS_OMITTED_SCOPE_VALUE);
    pushUniqueBullet(bullets, "systems", "systems", PEOPLE_AND_SYSTEMS_OMITTED_SCOPE_VALUE);
  } else if (!peopleAndSystemsOmitted) {
    pushUniqueBullet(
      bullets,
      "people",
      "people",
      people.length > 0 ? formatScopeNameListLine(people) : PEOPLE_IN_SCOPE_STORED_EMPTY,
    );
    pushUniqueBullet(
      bullets,
      "systems",
      "systems",
      systems.length > 0 ? formatScopeNameListLine(systems) : SYSTEMS_IN_SCOPE_STORED_EMPTY,
    );
  }

  for (const label of input.missingItemLabels ?? []) {
    pushUniqueBullet(bullets, "gap", gapBulletId(label), label);
  }

  if (bullets.length === 0) {
    pushUniqueBullet(
      bullets,
      "fallback",
      "fallback",
      "Scope was not stored on this draft.",
    );
  }

  return bullets;
}

/**
 * Re-derivation must not silently discard operator work: a row the operator edited keeps its value,
 * operator-added rows are preserved, and removed rows stay removed.
 */
export function reconcileScopeUnderstandingBullets(
  input: ReconcileScopeUnderstandingBulletsInput,
): ScopeUnderstandingBullet[] {
  const previousById = new Map(input.previous.map((bullet) => [bullet.id, bullet]));
  const dismissedIds = new Set(input.dismissedIds);
  const derivedRows = input.inferred
    .filter((bullet) => !dismissedIds.has(bullet.id))
    .map((bullet) => {
      const prior = previousById.get(bullet.id);

      if (isScopeMirroredFromActorsRow(bullet.kind)) {
        return bullet;
      }

      if (prior === undefined || prior.source !== "user") {
        return bullet;
      }

      return { ...bullet, value: prior.value, source: "user" as const };
    });
  const operatorRows = input.previous.filter(
    (bullet) => bullet.kind === "custom" && !dismissedIds.has(bullet.id),
  );

  return [...derivedRows, ...operatorRows];
}
