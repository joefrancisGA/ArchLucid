namespace ArchLucid.Core.AzureExtractor;

/// <summary>Well-known entry names inside Azure extractor ZIP archives.</summary>
public static class AzureExtractorPackageZipEntryNames
{
    public const string Manifest = "manifest.json";

    public const string Resources = "resources.json";

    public const string RoleAssignments = "role-assignments.json";

    public const string DiagnosticSettings = "diagnostic-settings.json";

    public const string NetworkAssociations = "network-associations.json";

    public const string PolicyAssignments = "policy-assignments.json";

    public const string FederatedCredentials = "federated-credentials.json";

    public const string EntraGroupMemberships = "entra-group-memberships.json";

    public const string DefenderSummary = "defender-summary.json";

    public const string EffectiveNetworkControls = "effective-network-controls.json";

    public const string AdfLinkedServices = "adf-linked-services.json";

    public const string AdfDatasets = "adf-datasets.json";

    public const string AdfPipelineFlows = "adf-pipeline-flows.json";

    public const string AdfTriggers = "adf-triggers.json";

    public const string AdfIntegrationRuntimes = "adf-integration-runtimes.json";

    public const string AdfDataflows = "adf-dataflows.json";

    public static IReadOnlyCollection<string> OptionalInventoryEntryNames { get; } =
    [
        RoleAssignments,
        DiagnosticSettings,
        NetworkAssociations,
        PolicyAssignments,
        FederatedCredentials,
        EntraGroupMemberships,
        DefenderSummary,
        EffectiveNetworkControls,
        AdfLinkedServices,
        AdfDatasets,
        AdfPipelineFlows,
        AdfTriggers,
        AdfIntegrationRuntimes,
        AdfDataflows,
    ];
}
