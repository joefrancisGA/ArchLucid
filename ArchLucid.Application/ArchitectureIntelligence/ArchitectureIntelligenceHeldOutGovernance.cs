using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// TB-2343 batch 49: held-out extraction microcases must never appear in visible training scores.
/// </summary>
public static class ArchitectureIntelligenceHeldOutGovernance
{
    public const string HeldOutCaseIdPrefix = "holdout-";

    public static void AssertTrainingIsolation(
        IReadOnlyList<ExtractionFidelityCase> visibleMicrocases,
        IReadOnlyList<ExtractionFidelityCase> heldOutMicrocases)
    {
        ArgumentNullException.ThrowIfNull(visibleMicrocases);
        ArgumentNullException.ThrowIfNull(heldOutMicrocases);

        HashSet<string> visibleIds = visibleMicrocases
            .Select(microCase => microCase.CaseId)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (ExtractionFidelityCase heldOut in heldOutMicrocases)
        {
            if (!heldOut.CaseId.StartsWith(HeldOutCaseIdPrefix, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"Held-out microcase '{heldOut.CaseId}' must use the '{HeldOutCaseIdPrefix}' prefix.");
            }

            if (visibleIds.Contains(heldOut.CaseId))
            {
                throw new InvalidOperationException(
                    $"Held-out microcase '{heldOut.CaseId}' must not appear in visible extraction scores.");
            }
        }
    }

    public static void AssertExtractionBenchmarkHasNoHeldOutCases(IReadOnlyList<ExtractionFidelityCase> microCases)
    {
        ArgumentNullException.ThrowIfNull(microCases);

        foreach (ExtractionFidelityCase microCase in microCases)
        {
            if (microCase.CaseId.StartsWith(HeldOutCaseIdPrefix, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"Extraction fidelity benchmark must not include held-out case '{microCase.CaseId}'.");
            }
        }
    }
}
