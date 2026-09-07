import {
  evaluateCareerArtifactHonesty,
  type CareerArtifactHonestyInput,
} from "@/lib/career-artifact/career-artifact-honesty";
import {
  buildTransparencyTrailExportSection,
  TRANSPARENCY_TRAIL_EXPORT_INCOMPLETE_BANNER,
} from "@/lib/feasibility/export-transparency-trail-section";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

export type SealedManifestJsonExportInput = {
  readonly rawManifestJson: string;
  readonly runId: string;
  readonly workingDesk: boolean;
  readonly careerArtifactHonesty?: Omit<CareerArtifactHonestyInput, "artifactKind" | "runId" | "workingDesk">;
};

export type SealedManifestJsonExportResult =
  | { readonly ok: true; readonly jsonText: string }
  | { readonly ok: false; readonly blockedReason: string };

function extractTransparencyTrail(parsed: unknown): TransparencyTrail | null {
  if (parsed === null || typeof parsed !== "object") {
    return null;
  }

  const root = parsed as Record<string, unknown>;
  const feasibilityVerdict = root.feasibilityVerdict;

  if (feasibilityVerdict !== null && typeof feasibilityVerdict === "object") {
    const trail = (feasibilityVerdict as Record<string, unknown>).transparencyTrail;

    if (trail !== null && typeof trail === "object") {
      return trail as TransparencyTrail;
    }
  }

  const directTrail = root.transparencyTrail;

  if (directTrail !== null && typeof directTrail === "object") {
    return directTrail as TransparencyTrail;
  }

  return null;
}

/** FC-55: wrap sealed manifest JSON with trail arrays or honesty banner; fail closed on Working desk. */
export function buildSealedManifestExportJson(
  input: SealedManifestJsonExportInput,
): SealedManifestJsonExportResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(input.rawManifestJson) as unknown;
  } catch {
    return { ok: true, jsonText: input.rawManifestJson };
  }

  const transparencyTrail =
    input.careerArtifactHonesty?.transparencyTrail
    ?? input.careerArtifactHonesty?.manifestSummary?.feasibilityVerdict?.transparencyTrail
    ?? extractTransparencyTrail(parsed);

  if (input.workingDesk) {
    const verdict = evaluateCareerArtifactHonesty({
      ...input.careerArtifactHonesty,
      artifactKind: "export",
      runId: input.runId,
      workingDesk: true,
      transparencyTrail,
    });

    if (!verdict.canRender) {
      return {
        ok: false,
        blockedReason: verdict.blockedReasons[0] ?? TRANSPARENCY_TRAIL_EXPORT_INCOMPLETE_BANNER,
      };
    }
  }

  const trailSection = buildTransparencyTrailExportSection(transparencyTrail);
  const envelope = {
    _careerExportHonesty: {
      transparencyTrail: trailSection,
      incompleteBanner:
        trailSection === null ? TRANSPARENCY_TRAIL_EXPORT_INCOMPLETE_BANNER.replace(/^>\s*/, "") : null,
    },
    manifest: parsed,
  };

  return { ok: true, jsonText: JSON.stringify(envelope, null, 2) };
}
