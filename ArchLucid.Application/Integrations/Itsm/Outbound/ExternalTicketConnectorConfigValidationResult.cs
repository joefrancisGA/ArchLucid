namespace ArchLucid.Application.Integrations.Itsm.Outbound;

public sealed record ExternalTicketConnectorConfigValidationResult(bool IsConfigured, string? Detail);
