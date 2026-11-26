using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed record RuntimeCatalogAssessment(bool CatalogCurrent,
    IReadOnlyList<RuntimeAdvisoryFindingCandidate> Findings, int UnknownAssessments)
{
    public IReadOnlyList<RuntimeLifecycleFindingCandidate> LifecycleFindings { get; init; } = [];
}
