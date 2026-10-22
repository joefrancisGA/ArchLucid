using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

internal static class AuditEvidenceSelectorSupport
{
    public static AuditEvidenceRequirementSelectionRecord Insufficient(
        AuditEvidenceRequirementRecord requirement,
        string reason) =>
        new()
        {
            Requirement = requirement,
            CollectionStatus = AuditEvidenceCollectionStatus.Insufficient,
            Gaps =
            [
                new AuditEvidenceGapRecord
                {
                    RequirementId = requirement.RequirementId,
                    CollectionStatus = AuditEvidenceCollectionStatus.Insufficient,
                    Reason = reason,
                },
            ],
        };

    public static AuditEvidenceRequirementSelectionRecord Unsupported(
        AuditEvidenceRequirementRecord requirement,
        string reason) =>
        new()
        {
            Requirement = requirement,
            CollectionStatus = AuditEvidenceCollectionStatus.Unsupported,
            Gaps =
            [
                new AuditEvidenceGapRecord
                {
                    RequirementId = requirement.RequirementId,
                    CollectionStatus = AuditEvidenceCollectionStatus.Unsupported,
                    Reason = reason,
                },
            ],
        };

    public static AuditEvidenceRequirementSelectionRecord Collected(
        AuditEvidenceRequirementRecord requirement,
        IReadOnlyList<AuditEvidenceCandidateRecord> candidates) =>
        new()
        {
            Requirement = requirement,
            CollectionStatus = AuditEvidenceCollectionStatus.Collected,
            Candidates = candidates,
        };

    public static bool MatchesRequiredResourceType(
        AzureInventoryResourceRecord resource,
        string? requiredResourceTypesCsv)
    {
        if (string.IsNullOrWhiteSpace(requiredResourceTypesCsv))
            return true;

        return requiredResourceTypesCsv
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(token => resource.ResourceType.Contains(token, StringComparison.OrdinalIgnoreCase));
    }
}
