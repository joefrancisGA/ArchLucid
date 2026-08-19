namespace ArchLucid.Architecture.Tests;

/// <summary>
///     TB-2335: grandfathered outbound probe / HttpClient adapter implementations still hosted in
///     <c>ArchLucid.Api</c> until <strong>TB-2334</strong> moves IdP diagnostics to Host.Composition.
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
        "WebhookSubscriptionTestService",
        "OidcWellKnownDiagnosticsService",
        "SamlOperationalDiagnosticsService",
        "IdentityProviderDiscoveryService",
    ];

    internal static readonly string[] AllowlistedApiWebLayerAddHttpClientImplementationTypeNames =
    [
        "OidcWellKnownDiagnosticsService",
        "SamlOperationalDiagnosticsService",
        "IdentityProviderDiscoveryService",
    ];
}
