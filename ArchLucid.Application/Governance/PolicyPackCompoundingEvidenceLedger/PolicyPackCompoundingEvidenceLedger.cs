using ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;

namespace ArchLucid.Application.Governance.PolicyPackCompoundingEvidenceLedger;

/// <summary>
///     TB-885 / DX-18: older-vs-newer pack version incremental catch on one historical run (internal instrument).
/// </summary>
public sealed class PolicyPackCompoundingEvidenceLedger
{
    public const string SchemaId = "archlucid.policy-pack-compounding-evidence-ledger.v1";

    public const string ClaimBoundary =
        "Internal differentiability instrument — not a buyer compounding rate.";

    public required string Schema { get; init; }

    public required DateTime GeneratedUtc { get; init; }

    public required Guid PolicyPackId { get; init; }

    public required string RunId { get; init; }

    public required string OlderVersionLabel { get; init; }

    public required string NewerVersionLabel { get; init; }

    public required bool OlderGateBlocked { get; init; }

    public required bool NewerGateBlocked { get; init; }

    public required PolicyPackBeforeAfterDiffChangeSet IncrementalCatch { get; init; }

    public required IReadOnlyList<PolicyPackCompoundingEvidenceChangeLogCitation> ChangeLogCitations { get; init; }

    public required string ClaimBoundaryText { get; init; }
}
