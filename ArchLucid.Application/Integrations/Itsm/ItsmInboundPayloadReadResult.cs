namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Validated external key and status value extracted from an inbound ITSM webhook payload.</summary>
public sealed class ItsmInboundPayloadReadResult
{
    public required string ExternalKey { get; init; }

    public required string StatusValue { get; init; }
}
