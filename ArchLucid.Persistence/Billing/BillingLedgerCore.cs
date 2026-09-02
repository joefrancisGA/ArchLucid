using ArchLucid.Core.Billing;

namespace ArchLucid.Persistence.Billing;

/// <summary>
///     Shared billing ledger rules for SQL and in-memory <see cref="IBillingLedger" /> implementations.
/// </summary>
internal static class BillingLedgerCore
{
    public const string StatusActive = "Active";
    public const string StatusPending = "Pending";
    public const string StatusSuspended = "Suspended";
    public const string StatusCanceled = "Canceled";
    public const string WebhookStatusReceived = "Received";
    public const int MinHistoryRows = 1;
    public const int MaxHistoryRows = 500;

    public static void ValidateHistoryMaxRows(int maxRows)
    {
        if (maxRows is <= 0 or > MaxHistoryRows)
            throw new ArgumentOutOfRangeException(nameof(maxRows));
    }

    public static bool IsActiveStatus(string? status) =>
        string.Equals(status, StatusActive, StringComparison.OrdinalIgnoreCase);

    public static BillingSubscriptionSnapshot ToSnapshot(BillingSubscriptionRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        return new BillingSubscriptionSnapshot(
            row.Provider,
            row.Tier,
            row.Seats,
            row.Workspaces,
            row.Status);
    }

    public static BillingSubscriptionRow CreatePendingCheckout(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string provider,
        string providerSessionId,
        string tierCode,
        int seats,
        int workspaces) =>
        new(
            tenantId,
            workspaceId,
            projectId,
            provider,
            providerSessionId,
            tierCode,
            seats,
            workspaces,
            StatusPending);

    public static BillingSubscriptionRow CreateActiveSubscription(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string provider,
        string providerSubscriptionId,
        string tierCode,
        int seats,
        int workspaces) =>
        new(
            tenantId,
            workspaceId,
            projectId,
            provider,
            providerSubscriptionId,
            tierCode,
            seats,
            workspaces,
            StatusActive);

    public static BillingSubscriptionRow WithStatus(BillingSubscriptionRow row, string status)
    {
        ArgumentNullException.ThrowIfNull(row);

        return row with { Status = status };
    }

    public static BillingSubscriptionRow WithTier(BillingSubscriptionRow row, string tierCode)
    {
        ArgumentNullException.ThrowIfNull(row);

        return row with { Tier = tierCode };
    }

    public static BillingSubscriptionRow WithSeats(BillingSubscriptionRow row, int seatsPurchased)
    {
        ArgumentNullException.ThrowIfNull(row);

        return row with { Seats = seatsPurchased };
    }

    public static BillingSubscriptionStateHistoryEntry CreateStateHistoryEntry(
        string changeKind,
        BillingSubscriptionRow? previous,
        BillingSubscriptionRow next,
        DateTimeOffset recordedUtc,
        Guid? historyId = null)
    {
        ArgumentNullException.ThrowIfNull(next);
        ArgumentException.ThrowIfNullOrWhiteSpace(changeKind);

        return new BillingSubscriptionStateHistoryEntry
        {
            HistoryId = historyId ?? Guid.NewGuid(),
            TenantId = next.TenantId,
            WorkspaceId = next.WorkspaceId,
            ProjectId = next.ProjectId,
            RecordedUtc = recordedUtc,
            ChangeKind = changeKind,
            PrevStatus = previous?.Status,
            NewStatus = next.Status,
            PrevTier = previous?.Tier,
            NewTier = next.Tier,
            PrevSeatsPurchased = previous?.Seats,
            NewSeatsPurchased = next.Seats,
            PrevWorkspacesPurchased = previous?.Workspaces,
            NewWorkspacesPurchased = next.Workspaces,
            PrevProvider = previous?.Provider,
            NewProvider = next.Provider,
            PrevProviderSubscriptionId = previous?.ProviderSubscriptionId,
            NewProviderSubscriptionId = next.ProviderSubscriptionId,
        };
    }

    public static IReadOnlyList<BillingSubscriptionStateHistoryEntry> SelectTenantHistory(
        IEnumerable<BillingSubscriptionStateHistoryEntry> history,
        Guid tenantId,
        int maxRows)
    {
        ArgumentNullException.ThrowIfNull(history);
        ValidateHistoryMaxRows(maxRows);

        return history
            .Where(entry => entry.TenantId == tenantId)
            .OrderByDescending(static entry => entry.RecordedUtc)
            .Take(maxRows)
            .ToList();
    }

    public static bool MatchesProviderSubscriptionId(BillingSubscriptionRow row, string providerSubscriptionId)
    {
        ArgumentNullException.ThrowIfNull(row);

        if (string.IsNullOrWhiteSpace(providerSubscriptionId))
            return false;

        return string.Equals(
            row.ProviderSubscriptionId,
            providerSubscriptionId.Trim(),
            StringComparison.Ordinal);
    }
}

internal sealed record BillingSubscriptionRow(
    Guid TenantId,
    Guid WorkspaceId,
    Guid ProjectId,
    string Provider,
    string ProviderSubscriptionId,
    string Tier,
    int Seats,
    int Workspaces,
    string Status);
