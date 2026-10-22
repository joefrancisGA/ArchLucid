using ArchLucid.Core.Persistence.ApplicationPorts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>Derived ITSM tracking flags for inspect/list read models (TB-391).</summary>
internal static class RunFindingExternalTrackingDerivedFields
{
    internal static bool IsTrackedExternally(RunFindingExternalTrackingReadRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        if (!string.IsNullOrWhiteSpace(row.ItsmLinkedTicketsSummary))
            return true;

        return !string.IsNullOrWhiteSpace(row.Provider) && !string.IsNullOrWhiteSpace(row.ExternalKey);
    }

    internal static string? ResolveExternalTrackingSummary(RunFindingExternalTrackingReadRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        if (!IsTrackedExternally(row))
            return null;

        if (!string.IsNullOrWhiteSpace(row.ItsmLinkedTicketsSummary))
            return row.ItsmLinkedTicketsSummary.Trim();

        return $"{row.Provider!.Trim()}:{row.ExternalKey!.Trim()}";
    }
}
