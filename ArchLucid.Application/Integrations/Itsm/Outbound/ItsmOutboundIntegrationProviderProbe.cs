namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Local configuration posture plus optional live reachability for one ITSM vendor.</summary>
public sealed record ItsmOutboundIntegrationProviderProbe(bool LocallyConfigured, bool? Reachable, string Summary);
