using ArchLucid.Application.Explanation.Models;
using ArchLucid.Contracts.Persistence.Explanation;

namespace ArchLucid.Application.Explanation;

/// <summary>Maps persistence read DTOs to Application explanation models.</summary>
public static class FindingExplainabilityEvidenceMapper
{
    public static FindingExplainabilityEvidence ToModel(FindingExplainabilityEvidenceRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        return new FindingExplainabilityEvidence(
            record.EvidenceRefs,
            record.Conclusion,
            record.AlternativePathsConsidered,
            record.RuleId);
    }
}
