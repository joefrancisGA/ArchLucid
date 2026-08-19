namespace ArchLucid.Architecture.Tests;

/// <summary>
///     TB-2335: grandfathered outbound probe / HttpClient adapter implementations still hosted in
///     <c>ArchLucid.Api</c> until follow-on composition-root moves complete.
/// </summary>
internal static class ApiWebLayerOutboundAdapterArchitectureConstants
{
    internal const string ApiAssemblyName = "ArchLucid.Api";

    internal const string ApiWebLayerServiceCollectionExtensionsRelativePath =
        "ArchLucid.Api/Configuration/ApiWebLayerServiceCollectionExtensions.cs";

    internal static readonly string[] ForbiddenOutboundAdapterTypeNameSuffixes =
    [
        "ProbeService",
        "WebhookDryRunService",
        "ConnectivityService",
        "WellKnownDiagnosticsService",
        "OperationalDiagnosticsService",
        "ProviderDiscoveryService",
        "SubscriptionTestService",
    ];

    internal static readonly string[] AllowlistedOutboundAdapterImplementationTypeNames =
    [
        "IdentityProviderDiscoveryService",
        "MarketplaceWebhookConnectivityService",
        "OidcWellKnownDiagnosticsService",
        "OutboundWebhookDryRunService",
        "SamlOperationalDiagnosticsService",
        "TeamsIncomingWebhookConnectionProbeService",
        "WebhookSubscriptionTestService",
    ];

    internal static readonly string[] AllowlistedApiWebLayerAddHttpClientImplementationTypeNames =
    [
        "IdentityProviderDiscoveryService",
        "OidcWellKnownDiagnosticsService",
        "OutboundWebhookDryRunService",
        "SamlOperationalDiagnosticsService",
    ];
}
