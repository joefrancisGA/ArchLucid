namespace ArchLucid.Application.Integrations.AzureBoards;

/// <summary>
/// Interprets the last persisted Azure Boards connection test without calling Azure DevOps.
/// Success copy historically includes "reachable" (live probe) or "succeed" (UI test feedback).
/// </summary>
public static class AzureBoardsLastConnectionTestInterpreter
{
    public static bool? TryInterpret(DateTime? lastTestUtc, string? lastTestSummary)
    {
        if (lastTestUtc is null && string.IsNullOrWhiteSpace(lastTestSummary))
        {
            return null;
        }

        if (IsSuccessSummary(lastTestSummary))
        {
            return true;
        }

        return false;
    }

    public static bool IsSuccessSummary(string? summary)
    {
        if (string.IsNullOrWhiteSpace(summary))
        {
            return false;
        }

        string lowered = summary.Trim().ToLowerInvariant();

        return lowered.Contains("reachable", StringComparison.Ordinal)
            || lowered.Contains("succeed", StringComparison.Ordinal);
    }
}
