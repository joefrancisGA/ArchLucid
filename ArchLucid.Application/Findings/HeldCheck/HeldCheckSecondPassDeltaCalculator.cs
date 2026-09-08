using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings.HeldCheck;

/// <summary>Computes held-check second-pass deltas between snapshots (DX-60).</summary>
public static class HeldCheckSecondPassDeltaCalculator
{
    public static HeldCheckSecondPassDelta Compute(
        IReadOnlyList<HeldCheckLedgerRollupEntry>? priorLedgerEntries,
        HeldCheckInputCode inputCode,
        FindingsSnapshot newSnapshot)
    {
        ArgumentNullException.ThrowIfNull(newSnapshot);

        HeldCheckLedgerRollupEntry? priorEntry = priorLedgerEntries?
            .FirstOrDefault(entry => entry.InputCode == inputCode);

        if (priorEntry is null || priorEntry.EngineCount == 0)
        {
            return HeldCheckSecondPassDelta.Empty;
        }

        HashSet<string> heldEngineTypes = priorEntry.EngineTypes
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<string> unblockedEngineTypes = [];
        int newDecisionGradeCount = 0;

        foreach (string engineType in heldEngineTypes)
        {
            List<Finding> engineFindings = newSnapshot.Findings
                .Where(finding => string.Equals(finding.EngineType, engineType, StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (engineFindings.Count == 0)
            {
                continue;
            }

            unblockedEngineTypes.Add(engineType);
            newDecisionGradeCount += engineFindings.Count(finding =>
                finding.Classification == FindingClassification.DecisionGradeFinding);
        }

        return new HeldCheckSecondPassDelta(unblockedEngineTypes, newDecisionGradeCount);
    }
}

public readonly record struct HeldCheckSecondPassDelta(
    IReadOnlyList<string> UnblockedEngineTypes,
    int NewDecisionGradeCount)
{
    public static HeldCheckSecondPassDelta Empty { get; } = new([], 0);
}
