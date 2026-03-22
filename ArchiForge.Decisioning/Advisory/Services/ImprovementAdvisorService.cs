using ArchiForge.Core.Comparison;
using ArchiForge.Decisioning.Advisory.Analysis;
using ArchiForge.Decisioning.Advisory.Models;
using ArchiForge.Decisioning.Models;

namespace ArchiForge.Decisioning.Advisory.Services;

public sealed class ImprovementAdvisorService(
    IImprovementSignalAnalyzer signalAnalyzer,
    IRecommendationGenerator recommendationGenerator) : IImprovementAdvisorService
{
    public Task<ImprovementPlan> GeneratePlanAsync(
        GoldenManifest manifest,
        FindingsSnapshot findingsSnapshot,
        CancellationToken ct)
    {
        _ = ct;
        var signals = signalAnalyzer.Analyze(manifest, findingsSnapshot);
        var recommendations = recommendationGenerator.Generate(signals);

        return Task.FromResult(new ImprovementPlan
        {
            RunId = manifest.RunId,
            Recommendations = recommendations.ToList(),
            SummaryNotes = BuildSummary(recommendations)
        });
    }

    public Task<ImprovementPlan> GeneratePlanAsync(
        GoldenManifest manifest,
        FindingsSnapshot findingsSnapshot,
        ComparisonResult comparison,
        CancellationToken ct)
    {
        _ = ct;
        var signals = signalAnalyzer.Analyze(manifest, findingsSnapshot, comparison);
        var recommendations = recommendationGenerator.Generate(signals);

        return Task.FromResult(new ImprovementPlan
        {
            RunId = manifest.RunId,
            ComparedToRunId = comparison.BaseRunId,
            Recommendations = recommendations.ToList(),
            SummaryNotes = BuildSummary(recommendations)
        });
    }

    private static List<string> BuildSummary(IReadOnlyList<ImprovementRecommendation> recommendations)
    {
        var notes = new List<string>();

        if (recommendations.Count == 0)
        {
            notes.Add("No significant improvements were identified.");
            return notes;
        }

        notes.Add($"Generated {recommendations.Count} improvement recommendations.");

        var high = recommendations.Count(x =>
            string.Equals(x.Urgency, "High", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(x.Urgency, "Critical", StringComparison.OrdinalIgnoreCase));

        notes.Add($"{high} recommendations are high urgency or above.");

        var topCategories = recommendations
            .GroupBy(x => x.Category)
            .OrderByDescending(x => x.Count())
            .Select(x => $"{x.Key}: {x.Count()}")
            .Take(3)
            .ToList();

        notes.AddRange(topCategories);

        return notes;
    }
}
