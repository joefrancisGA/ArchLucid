using ArchiForge.Core.Comparison;
using ArchiForge.Decisioning.Advisory.Models;
using ArchiForge.Decisioning.Models;

namespace ArchiForge.Decisioning.Advisory.Services;

public interface IImprovementAdvisorService
{
    Task<ImprovementPlan> GeneratePlanAsync(
        GoldenManifest manifest,
        FindingsSnapshot findingsSnapshot,
        CancellationToken ct);

    Task<ImprovementPlan> GeneratePlanAsync(
        GoldenManifest manifest,
        FindingsSnapshot findingsSnapshot,
        ComparisonResult comparison,
        CancellationToken ct);
}
