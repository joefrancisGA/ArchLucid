namespace ArchLucid.Cli.Commands;

/// <summary>Stable proof-packet filenames and JSON schema ids for regression tests.</summary>
public static class PilotProofPacketArtifactCatalog
{
    public const string RunEvidenceSchema = "archlucid.pilot-run-deltas.v1";

    public const string EnvironmentSchema = "archlucid.proof-packet.environment.v1";

    public const string QuoteToProofSchema = "archlucid.quote-to-proof-readiness.v1";

    public const string RedactionManifestSchema = "archlucid.proof-packet.redaction-manifest.v1";

    public const string GovernanceOutcomeSchema = "archlucid.proof-packet.governance-outcome.v1";

    public const string AuditEvidenceSummarySchema = "archlucid.proof-packet.audit-evidence-summary.v1";

    public const string DataConsistencySummarySchema = "archlucid.proof-packet.data-consistency-summary.v1";

    public const string ScaleEnvelopeSchema = "archlucid.proof-packet.scale-envelope.v1";

    public const string AuditSampleSchema = "archlucid.proof-packet.audit-sample.v1";

    public const string ArtifactManifestSchema = "archlucid.proof-packet.artifact-manifest.v1";

    public const string RoiMetricSourcesSchema = "archlucid.proof-packet.roi-metric-sources.v1";

    public static IReadOnlyList<string> CoreFileNames { get; } =
    [
        "run-evidence.json",
        "environment.json",
        "quote-to-proof-readiness.json",
        "redaction-manifest.json",
        "limitations.md",
        "governance-outcome-summary.json",
        "audit-evidence-summary.json",
        "audit-evidence-summary.md",
        "data-consistency-summary.json",
        "data-consistency-summary.md",
        "scale-envelope-evidence.json",
        "audit-sample.json",
        "artifact-manifest.json",
    ];
}
