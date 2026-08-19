namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Aggregate outbound ITSM connectivity assessment for the active tenant scope.</summary>
public sealed record ItsmOutboundIntegrationHealthReport(
    string Status,
    ItsmOutboundIntegrationProviderProbe Jira,
    ItsmOutboundIntegrationProviderProbe ServiceNow,
    bool Return503);
