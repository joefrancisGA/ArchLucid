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
}
