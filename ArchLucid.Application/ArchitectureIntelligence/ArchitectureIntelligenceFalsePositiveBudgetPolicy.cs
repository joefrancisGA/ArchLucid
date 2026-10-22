namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// TB-2343 batch 49: golden closed-loop false-positive budgets enforced in CI regression tests.
/// </summary>
public static class ArchitectureIntelligenceFalsePositiveBudgetPolicy
{
    public const int GoldenIncompleteMaxFalsePositivesPerDimension = 5;

    public const int GoldenIncompleteMaxFalsePositivesTotal = 12;

    public static bool IsWithinGoldenBudget(
        IReadOnlyDictionary<string, int> falsePositivesByDimension,
        int falsePositiveCount)
    {
        ArgumentNullException.ThrowIfNull(falsePositivesByDimension);

        if (falsePositiveCount > GoldenIncompleteMaxFalsePositivesTotal)
        {
            return false;
        }

        foreach (KeyValuePair<string, int> pair in falsePositivesByDimension)
        {
            if (pair.Value > GoldenIncompleteMaxFalsePositivesPerDimension)
            {
                return false;
            }
        }

        return true;
    }
}
