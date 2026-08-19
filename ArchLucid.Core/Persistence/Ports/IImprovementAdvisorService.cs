using ArchLucid.Contracts.Advisory.Models;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Core.Persistence.Ports;

public interface IImprovementAdvisorService
{
    Task<ImprovementPlan> GeneratePlanAsync(
        ManifestDocument manifest,
        FindingsSnapshot findingsSnapshot,
        CancellationToken ct);

    Task<ImprovementPlan> GeneratePlanAsync(
        ManifestDocument manifest,
        FindingsSnapshot findingsSnapshot,
        ComparisonResult comparison,
        CancellationToken ct);
}
