import {
  ARCHITECTURES_NEW_PATH,
  architectureIdentityPath,
} from "@/lib/architecture/architecture-routes";

export type ResolveWorkingStartHrefInput = {
  /** Last-open durable architecture identity desk. */
  readonly lastOpenArchitectureId?: string | null;
  /** Parent architecture id from an active in-flight review operation when last-open is empty. */
  readonly inFlightParentArchitectureId?: string | null;
};

export type ResolveWorkingStartHrefResult = {
  readonly href: string;
  readonly reason: "last-open-architecture" | "in-flight-parent-architecture" | "new-architecture";
};

function trimmedId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

/** ADR 0077 / AO-15 — Working Start and Alt+N land on the architecture desk, not a peer review URL. */
export function resolveWorkingStartHref(input: ResolveWorkingStartHrefInput): ResolveWorkingStartHrefResult {
  const lastOpenArchitectureId = trimmedId(input.lastOpenArchitectureId);
  const inFlightParentArchitectureId = trimmedId(input.inFlightParentArchitectureId);

  if (lastOpenArchitectureId !== null) {
    return {
      href: architectureIdentityPath(lastOpenArchitectureId),
      reason: "last-open-architecture",
    };
  }

  if (inFlightParentArchitectureId !== null) {
    return {
      href: architectureIdentityPath(inFlightParentArchitectureId),
      reason: "in-flight-parent-architecture",
    };
  }

  return {
    href: ARCHITECTURES_NEW_PATH,
    reason: "new-architecture",
  };
}
