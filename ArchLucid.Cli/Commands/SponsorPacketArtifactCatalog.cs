namespace ArchLucid.Cli.Commands;

/// <summary>Canonical sponsor-packet filenames (T2-7 buyer-ready bundle).</summary>
public static class SponsorPacketArtifactCatalog
{
    public const string FormatVersion = "1.0";

    public const string IndexFileName = "index.md";

    public const string PackManifestFileName = "pack-manifest.json";

    public const string ProvenanceReferencesFileName = "provenance-references.json";

    public const string SponsorReportFileName = "sponsor-report.json";

    public const string SponsorReviewPacketFileName = "sponsor-review-packet.md";

    public const string FirstValueReportFileName = "first-value-report.md";

    public const string PilotRunDeltasFileName = "pilot-run-deltas.json";

    public const string BuyerDecisionBriefFileName = "buyer-decision-brief.md";

    public const string ProvenanceSchema = "archlucid.sponsor-packet.provenance.v1";

    public static IReadOnlyList<SponsorPacketArtifactEntry> IndexEntries { get; } =
    [
        new(IndexFileName, "Start here — explains every file in this bundle."),
        new(BuyerDecisionBriefFileName, "One-page buyer decision brief: outcome, value, caveats, and next commercial step."),
        new(FirstValueReportFileName, "Sponsor narrative for the committed run (ROI basis labels included)."),
        new(SponsorReviewPacketFileName, "Consolidated review packet: manifest, findings, ROI disposition basis, decisions."),
        new(SponsorReportFileName, "Tenant portfolio ROI snapshot (`GET /v1/roi/sponsor-report`) with scope labels."),
        new(PilotRunDeltasFileName, "Structured pilot deltas JSON (same payload as `run-evidence.json`)."),
        new("run-evidence.json", "Canonical pilot-run-deltas API response for this run."),
        new("limitations.md", "Buyer-safe caveats, skipped gates, and sponsor-send hold reasons."),
        new(ProvenanceReferencesFileName, "Audit event ids and artifact ids for provenance (no payloads or secrets)."),
        new("audit-sample.json", "Recent audit event ids tied to this run."),
        new("artifact-manifest.json", "Artifact ids exported for this run."),
        new("proof-summary.md", "First-value summary with ROI source catalog link when present."),
        new("roi-metric-sources.md", "ROI metric scope catalog for sponsor reviewers."),
        new(PackManifestFileName, "Deterministic SHA-256 manifest for reproducible regeneration."),
    ];
}

/// <summary>One row in <see cref="SponsorPacketArtifactCatalog.IndexEntries"/>.</summary>
public sealed record SponsorPacketArtifactEntry(string FileName, string Purpose);
