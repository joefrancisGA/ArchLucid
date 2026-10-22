import {
  type DemoSampleUniverse,
  resolveDemoSampleUniverse,
} from "@/lib/demo-sample-universe";

export type WhyArchLucidDemoUniverse = DemoSampleUniverse;

export type ResolveWhyArchLucidDemoUniverseArgs = {
  readonly demoRunId?: string | null;
  readonly citationLabels?: readonly string[];
  /** True when sponsor pack watermark is Contoso-seeded demo tenant. */
  readonly contosoDemoWatermark?: boolean;
};

/**
 * Classifies the `/why-archlucid` telemetry payload so Claims chrome cannot sit over Contoso (TB-1306).
 */
export function resolveWhyArchLucidDemoUniverse(args: ResolveWhyArchLucidDemoUniverseArgs): WhyArchLucidDemoUniverse {
  const citationHaystack = (args.citationLabels ?? []).join("\n");
  const watermarkHint = args.contosoDemoWatermark === true ? "contoso" : "";

  return resolveDemoSampleUniverse({
    runId: args.demoRunId,
    textHints: `${citationHaystack}\n${watermarkHint}`,
  });
}

export function whyArchLucidUniverseWalkthroughLead(universe: WhyArchLucidDemoUniverse): string {
  switch (universe) {
    case "claims":
      return "See how ArchLucid turns architecture review into an export-ready decision package — sponsor report, finalized review record, evidence trail, approval, and audit record — using the Claims Intake sample workspace as a walkthrough.";
    case "contoso":
      return "See how ArchLucid turns architecture review into an export-ready decision package — sponsor report, finalized review record, evidence trail, approval, and audit record — using the Retail baseline sample workspace as a walkthrough.";
    case "unknown":
      return "See how ArchLucid turns architecture review into an export-ready decision package — sponsor report, finalized review record, evidence trail, approval, and audit record — using a demo sample workspace as a walkthrough.";
    default: {
      const _exhaustive: never = universe;

      return _exhaustive;
    }
  }
}

export function whyArchLucidSponsorPackSourceLine(universe: WhyArchLucidDemoUniverse): string {
  switch (universe) {
    case "claims":
      return "Aggregated proof from the evidence pack service — paired with the sample Claims Intake review below.";
    case "contoso":
      return "Aggregated proof from the evidence pack service — paired with the sample Retail baseline review below.";
    case "unknown":
      return "Aggregated proof from the evidence pack service — paired with the sample demo review below.";
    default: {
      const _exhaustive: never = universe;

      return _exhaustive;
    }
  }
}

export function whyArchLucidUniverseBannerTitle(universe: WhyArchLucidDemoUniverse): string {
  switch (universe) {
    case "claims":
      return "Claims Intake sample — pilot proof telemetry";
    case "contoso":
      return "Retail baseline sample — pilot proof telemetry";
    case "unknown":
      return "Demo sample universe could not be confirmed";
    default: {
      const _exhaustive: never = universe;

      return _exhaustive;
    }
  }
}

/** True when page chrome would claim Claims while the payload is Contoso-only (or the reverse). */
export function whyArchLucidChromeMismatchesPayload(
  chromeUniverse: WhyArchLucidDemoUniverse,
  payloadUniverse: WhyArchLucidDemoUniverse,
): boolean {
  if (chromeUniverse === "unknown" || payloadUniverse === "unknown") {
    return true;
  }

  return chromeUniverse !== payloadUniverse;
}
