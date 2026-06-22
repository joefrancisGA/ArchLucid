namespace ArchLucid.Persistence.Integrations;

/// <summary>Outcome of updating external tracking metadata for a tenant-scoped finding ↔ ITSM correlation.</summary>
public sealed class ItsmFindingCorrelationUpdateResult
{
    public ItsmFindingCorrelationUpdateStatus Status
    {
        get;
        init;
    }

    public ItsmFindingCorrelationRecord? Prior
    {
        get;
        init;
    }

    public ItsmFindingCorrelationRecord? Current
    {
        get;
        init;
    }

    public static ItsmFindingCorrelationUpdateResult NotFound { get; } =
        new() { Status = ItsmFindingCorrelationUpdateStatus.NotFound };

    public static ItsmFindingCorrelationUpdateResult ExternalKeyConflict { get; } =
        new() { Status = ItsmFindingCorrelationUpdateStatus.ExternalKeyConflict };
}

/// <summary>Status codes for <see cref="ItsmFindingCorrelationUpdateResult" />.</summary>
public enum ItsmFindingCorrelationUpdateStatus
{
    NotFound,
    Unchanged,
    Updated,
    ExternalKeyConflict
}
