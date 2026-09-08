import {
  ARCHITECTURES_LIST_PATH,
  REVIEWS_LIST_PATH,
  architectureIdentityPath,
} from "@/lib/architecture/architecture-routes";

export type ResolveWorkingAltRHrefInput = {
  readonly lastOpenArchitectureId?: string | null;
};

export type ResolveWorkingAltRHrefResult = {
  readonly href: string;
  readonly reason: "last-open-architecture" | "portfolio";
};

function trimmedId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

/** ADR 0079 / SY-07 — Working Alt+R opens the architecture desk or portfolio, never the reviews inbox. */
export function resolveWorkingAltRHref(input: ResolveWorkingAltRHrefInput): ResolveWorkingAltRHrefResult {
  const lastOpenArchitectureId = trimmedId(input.lastOpenArchitectureId);

  if (lastOpenArchitectureId !== null) {
    return {
      href: architectureIdentityPath(lastOpenArchitectureId),
      reason: "last-open-architecture",
    };
  }

  return {
    href: ARCHITECTURES_LIST_PATH,
    reason: "portfolio",
  };
}

/** Guard helper — Alt+R must never target the cross-architecture inbox on Working. */
export function isForbiddenWorkingAltRTarget(href: string): boolean {
  const path = href.split("?")[0] ?? "";

  return path === REVIEWS_LIST_PATH;
}
