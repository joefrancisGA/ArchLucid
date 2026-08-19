using ArchLucid.Core.Audit;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

public enum ItsmOutboundCreateTerminalKind
{
    None = 0,
    Succeeded = 1,
    VendorError = 2,
    Skipped = 3,
    CorrelationPersistenceFailed = 4
}

/// <summary>Result of <see cref="ItsmOutboundIssueCreationService.TryCreateForFindingAsync"/> — carries audit rows for the API layer.</summary>
public sealed class ItsmOutboundIssueCreationResult
{
    public ItsmOutboundCreateTerminalKind Kind
    {
        get;
        init;
    }

    /// <summary>HTTP status from vendor when <see cref="Kind"/> is <see cref="ItsmOutboundCreateTerminalKind.VendorError"/>.</summary>
    public int? VendorStatusCode
    {
        get;
        init;
    }

    /// <summary>Safe operator-facing text — no secrets; avoid reproducing full vendor URLs with query strings.</summary>
    public string? UserMessage
    {
        get;
        init;
    }

    /// <summary>Jira issue key or ServiceNow incident number/sys id fragment.</summary>
    public string? ExternalKey
    {
        get;
        init;
    }

    public IReadOnlyList<AuditEvent> AuditEvents
    {
        get;
        init;
    } = [];
}
