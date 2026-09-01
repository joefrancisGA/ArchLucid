using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts;

/// <summary>Default statuses for operator draft inventory (excludes redirect-only terminal rows).</summary>
public static class DraftRequestListStatusFilter
{
    public static readonly IReadOnlyList<DraftRequestStatus> DefaultInventoryStatuses =
    [
        DraftRequestStatus.Drafting,
        DraftRequestStatus.Admitted,
        DraftRequestStatus.Submitted,
        DraftRequestStatus.RunSpawned,
        DraftRequestStatus.Abandoned,
    ];

    public static IReadOnlyList<DraftRequestStatus> ParseOrDefault(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return DefaultInventoryStatuses;

        List<DraftRequestStatus> parsed = [];

        foreach (string token in raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (!Enum.TryParse(token, ignoreCase: true, out DraftRequestStatus status))
            {
                throw new InvalidOperationException(
                    $"Unsupported draft status '{token}'. Expected one of: {string.Join(", ", Enum.GetNames<DraftRequestStatus>())}.");
            }

            parsed.Add(status);
        }

        if (parsed.Count == 0)
            return DefaultInventoryStatuses;

        return parsed;
    }
}
