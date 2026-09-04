namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Validated external key and status value extracted from an inbound ITSM webhook payload.</summary>
public sealed class ItsmInboundPayloadReadResult
{
    public required string ExternalKey { get; init; }

    public required string StatusValue { get; init; }

    /// <summary>
    ///     Optional secondary status token when the vendor sends multiple state fields (e.g. ServiceNow
    ///     <c>state</c> display code plus canonical <c>incident_state</c> choice value).
    /// </summary>
    public string? AlternateStatusValue { get; init; }
}
