using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.InfraEvidence;

public sealed class SecurityEvidencePathReportResponse
{
    public Guid SnapshotId
    {
        get;
        init;
    }

    private IReadOnlyList<SecurityEvidencePathRankSummaryResponse> vulnerableAttackPaths = [];

    public IReadOnlyList<SecurityEvidencePathRankSummaryResponse> VulnerableAttackPaths
    {
        get => vulnerableAttackPaths;
        init => vulnerableAttackPaths = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<SecurityEvidencePathReportUnevaluatedGroupResponse> unevaluatedGroups = [];

    public IReadOnlyList<SecurityEvidencePathReportUnevaluatedGroupResponse> UnevaluatedGroups
    {
        get => unevaluatedGroups;
        init => unevaluatedGroups = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<SecurityEvidencePathReportVerificationResponse> inventoryVerifications = [];

    /// <summary>Latest recorded inventory checks for reported vulnerable paths. Missing entries are unknown.</summary>
    public IReadOnlyList<SecurityEvidencePathReportVerificationResponse> InventoryVerifications
    {
        get => inventoryVerifications;
        init => inventoryVerifications = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}

/// <summary>A historical, property-scoped verification observation. It is not a path verdict.</summary>
public sealed record SecurityEvidencePathReportVerificationResponse(
    Guid PathId, Guid ExplanationId, DateTime RecordedUtc, InventoryFalsificationProbe Verification);
