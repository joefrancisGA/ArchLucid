import {
  SCOPE_CONTEXT_PREVIEW_MAX_LENGTH,
  scopeBulletBehavior,
  stripScopeUnderstandingSection,
} from "./architecture-scope-understanding-shared";
import type {
  DeriveScopeUnderstandingBulletsInput,
  ReconcileScopeUnderstandingBulletsInput,
  ScopeActorInput,
  ScopeUnderstandingBullet,
  ScopeUnderstandingBulletKind,
} from "./architecture-scope-understanding-shared";

/** Labels each actor for scope mirroring — falls back to kind/trust when the label field is empty. */
export function actorScopeDisplayLabel(actor: ScopeActorInput): string {
  const trimmedLabel = actor.label?.trim() ?? "";

  if (trimmedLabel.length > 0) {
    return trimmedLabel;
  }

  const kind = actor.kind.trim();

  if (kind.length === 0) {
    return "";
  }

  const trustOrigin = actor.trustOrigin?.trim() ?? "";

  if (trustOrigin.length > 0 && trustOrigin !== "Internal") {
    return `${kind} (${trustOrigin})`;
  }

  return kind;
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

/** Flattens a typed row back to the `Label: value` line used in the brief and in assertions. */
export function scopeBulletText(bullet: ScopeUnderstandingBullet): string {
  const value = bullet.value.trim();

  if (bullet.label.length === 0) {
    return value;
  }

  return `${bullet.label}: ${value}`;
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
        ? `${overview.slice(0, SCOPE_CONTEXT_PREVIEW_MAX_LENGTH - 1).trimEnd()}…`
        : overview;

    pushUniqueBullet(bullets, "context", "context", excerpt);
  }

  const people = uniqueScopeLabels(
    (input.peopleAndSystems ?? [])
      .filter((entry) => entry.kind === "Human" || entry.kind === "Both")
      .map((entry) => actorScopeDisplayLabel(entry)),
  );
  const systems = uniqueScopeLabels(
    (input.peopleAndSystems ?? [])
      .filter((entry) => entry.kind === "Machine" || entry.kind === "Both")
      .map((entry) => actorScopeDisplayLabel(entry)),
  );

  pushUniqueBullet(bullets, "people", "people", people.slice(0, 4).join(", "));
  pushUniqueBullet(bullets, "systems", "systems", systems.slice(0, 4).join(", "));

  for (const label of input.missingItemLabels ?? []) {
    pushUniqueBullet(bullets, "gap", gapBulletId(label), label);
  }

  if (bullets.length === 0) {
    pushUniqueBullet(
      bullets,
      "fallback",
      "fallback",
      "ArchLucid will infer scope from the brief and evidence you provide in this intake.",
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
