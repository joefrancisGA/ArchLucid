using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Architecture;

/// <summary>Maps <see cref="QuickScanResult" /> domain output to the HTTP contract (top findings by severity).</summary>
public static class ArchitectureQuickScanResponseMapper
{
    public const string DemonstrationDisclaimer =
        "Quick Scan is a limited demonstration. Results are not saved as a workspace review and do not replace evidence-backed ArchLucid assessments.";

    /// <summary>Returns a new API DTO with at most <paramref name="maxFindings" /> findings, highest severities first.</summary>
    public static ArchitectureQuickScanResponse Map(
        QuickScanResult result,
        QuickScanRequestValidator.ValidatedQuickScanRequest request,
        int maxFindings = 5,
        bool isSampleResult = false)
    {
        ArgumentNullException.ThrowIfNull(result);
        ArgumentNullException.ThrowIfNull(request);

        if (maxFindings < 1)
            throw new ArgumentOutOfRangeException(nameof(maxFindings));

        List<ArchitectureQuickScanFindingItem> findings = result.Findings
            .OrderByDescending(static f => f.Severity)
            .Take(maxFindings)
            .Select(static f => new ArchitectureQuickScanFindingItem
            {
                Title = f.Category,
                Description = f.Message,
                Severity = f.Severity,
                ConfidenceScore = f.ConfidenceScore,
                ConfidenceLevel = f.ConfidenceLevel
            })
            .ToList();

        List<string> positiveObservations = result.Findings
            .Where(static f => f.Severity == FindingSeverity.Info)
            .OrderByDescending(static f => f.ConfidenceScore ?? 0)
            .Take(3)
            .Select(static f => string.IsNullOrWhiteSpace(f.Message) ? f.Category : f.Message)
            .ToList();

        if (positiveObservations.Count == 0)
        {
            positiveObservations =
            [
                "The description provides enough context to reason about major components and external dependencies.",
            ];
        }

        List<string> recommendedNextSteps =
        [
            "Create a workspace review to attach evidence, policy packs, and governance workflow.",
            "Start a full architecture review when diagrams or integration metadata are available.",
            "Request a demonstration if your team needs a guided walkthrough of ArchLucid.",
        ];

        return new ArchitectureQuickScanResponse
        {
            ScanId = result.ScanId,
            SystemName = request.SystemName,
            PrimaryEnvironment = request.PrimaryEnvironment,
            Summary = result.Summary,
            Findings = findings,
            PositiveObservations = positiveObservations,
            RecommendedNextSteps = recommendedNextSteps,
            CompletedUtc = result.CompletedUtc,
            IsSampleResult = isSampleResult,
            DemonstrationDisclaimer = DemonstrationDisclaimer,
        };
    }
}
