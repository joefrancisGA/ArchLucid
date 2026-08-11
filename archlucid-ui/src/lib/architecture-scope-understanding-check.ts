export type ScopeUnderstandingBullet = {
  readonly id: string;
  readonly text: string;
  readonly source: "inferred" | "user";
};

export type DeriveScopeUnderstandingBulletsInput = {
  readonly architectureName?: string;
  readonly businessOutcome?: string;
  readonly architectureOverview?: string;
  readonly systemName?: string;
  readonly intentText?: string;
  readonly peopleAndSystems?: readonly { readonly label: string; readonly kind: string }[];
  readonly missingItemLabels?: readonly string[];
};

export const SCOPE_UNDERSTANDING_HEADING = "What ArchLucid will treat as in-scope";
export const SCOPE_UNDERSTANDING_HELPER =
  "Edit any line, or type a new item below and choose Add to scope. Corrections are saved into the intake brief.";
export const SCOPE_UNDERSTANDING_ADD_LABEL = "Add an in-scope item";
export const SCOPE_UNDERSTANDING_ADD_PLACEHOLDER =
  "Type a system, constraint, or boundary, then choose Add to scope";
export const SCOPE_UNDERSTANDING_ADD_BUTTON_LABEL = "Add to scope";
export const SCOPE_UNDERSTANDING_ADD_HINT =
  "Type the item in the field, then choose Add to scope (or press Enter).";
export const SCOPE_UNDERSTANDING_CONFIRM_LABEL = "Confirm scope";
export const SCOPE_UNDERSTANDING_SECTION_HEADER = "Operator-confirmed in-scope understanding";

/**
 * Removes a previously merged scope block from a brief field. Without this, a brief that already
 * carries the confirmed-scope section would feed that section back in as new bullet text.
 */
export function stripScopeUnderstandingSection(text: string | null | undefined): string {
  if (text === null || text === undefined) {
    return "";
  }

  const sectionIndex = text.indexOf(SCOPE_UNDERSTANDING_SECTION_HEADER);

  if (sectionIndex < 0) {
    return text;
  }

  return text.slice(0, sectionIndex).trimEnd();
}

function pushUniqueBullet(bullets: ScopeUnderstandingBullet[], text: string, prefix: string): void {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return;
  }

  const duplicate = bullets.some((bullet) => bullet.text.toLowerCase() === trimmed.toLowerCase());

  if (duplicate) {
    return;
  }

  bullets.push({
    id: `${prefix}-${bullets.length + 1}`,
    text: trimmed,
    source: "inferred",
  });
}

/** Derives editable in-scope bullets from intake / create-home context (TB-2176). */
export function deriveScopeUnderstandingBullets(
  input: DeriveScopeUnderstandingBulletsInput,
): ScopeUnderstandingBullet[] {
  const bullets: ScopeUnderstandingBullet[] = [];
  const architectureName = input.architectureName?.trim() ?? input.systemName?.trim() ?? "";

  if (architectureName.length > 0) {
    pushUniqueBullet(bullets, `Primary system or architecture: ${architectureName}`, "system");
  }

  const outcome = stripScopeUnderstandingSection(input.businessOutcome).trim();

  if (outcome.length > 0) {
    pushUniqueBullet(bullets, `Business outcome: ${outcome}`, "outcome");
  }

  const overview = stripScopeUnderstandingSection(
    input.architectureOverview ?? input.intentText,
  ).trim();

  if (overview.length > 0) {
    const excerpt = overview.length > 180 ? `${overview.slice(0, 177).trimEnd()}…` : overview;

    pushUniqueBullet(bullets, `Architecture context: ${excerpt}`, "context");
  }

  const people = (input.peopleAndSystems ?? [])
    .filter((entry) => entry.kind === "Human" || entry.kind === "Both")
    .map((entry) => entry.label.trim())
    .filter((label) => label.length > 0);
  const systems = (input.peopleAndSystems ?? [])
    .filter((entry) => entry.kind === "Machine" || entry.kind === "Both")
    .map((entry) => entry.label.trim())
    .filter((label) => label.length > 0);

  if (people.length > 0) {
    pushUniqueBullet(bullets, `People in scope: ${people.slice(0, 4).join(", ")}`, "people");
  }

  if (systems.length > 0) {
    pushUniqueBullet(bullets, `Systems in scope: ${systems.slice(0, 4).join(", ")}`, "systems");
  }

  for (const label of input.missingItemLabels ?? []) {
    pushUniqueBullet(bullets, `Out of scope until clarified: ${label}`, "gap");
  }

  if (bullets.length === 0) {
    pushUniqueBullet(
      bullets,
      "ArchLucid will infer scope from the brief and evidence you provide in this intake.",
      "fallback",
    );
  }

  return bullets;
}

export function mergeScopeBulletsIntoBrief(
  bullets: readonly ScopeUnderstandingBullet[],
  baseBrief: string,
): string {
  const trimmedBrief = baseBrief.trim();
  const bulletLines = bullets
    .map((bullet) => bullet.text.trim())
    .filter((text) => text.length > 0)
    .map((text) => `- ${text}`);

  if (bulletLines.length === 0) {
    return trimmedBrief;
  }

  const section = `${SCOPE_UNDERSTANDING_SECTION_HEADER}:\n${bulletLines.join("\n")}`;

  if (trimmedBrief.length === 0) {
    return section;
  }

  if (trimmedBrief.includes(SCOPE_UNDERSTANDING_SECTION_HEADER)) {
    return trimmedBrief;
  }

  return `${trimmedBrief}\n\n${section}`;
}

export function normalizeScopeUnderstandingBullets(
  bullets: readonly ScopeUnderstandingBullet[],
): ScopeUnderstandingBullet[] {
  return bullets
    .map((bullet) => ({
      ...bullet,
      text: bullet.text.trim(),
    }))
    .filter((bullet) => bullet.text.length > 0);
}
