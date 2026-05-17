namespace ArchLucid.Core.Audit;

/// <summary>Append-only row for <c>dbo.PlatformAuditEvents</c> (not tenant session-scoped).</summary>
public sealed class PlatformAuditEvent
{
    public Guid EventId
    {
        get;
        set;
    } = Guid.NewGuid();

    public DateTime OccurredUtc
    {
        get;
        set;
    } = TimeProvider.System.UtcNowDateTime();

    public string EventType
    {
        get;
        set;
    } = null!;

    public string ActorUserId
    {
        get;
        set;
    } = null!;

    public string ActorUserName
    {
        get;
        set;
    } = null!;

    /// <summary>Tenant id that the event concerns (for example, deleted tenant).</summary>
    public Guid SubjectTenantId
    {
        get;
        set;
    }

    public string DataJson
    {
        get;
        set;
    } = "{}";

    public string? CorrelationId
    {
        get;
        set;
    }
}
