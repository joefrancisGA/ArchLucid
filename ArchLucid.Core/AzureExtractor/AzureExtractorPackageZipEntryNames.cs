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

    public const string ApplicationOwners = "application-owners.json";

    public const string DirectoryRoleAssignments = "directory-role-assignments.json";

    public const string GraphAppRoleAssignments = "graph-app-role-assignments.json";

    public const string DefenderSummary = "defender-summary.json";

    public const string DefenderPricings = "defender-pricings.json";

    public const string DefenderScoreControls = "defender-score-controls.json";

    public const string DefenderAssessments = "defender-assessments.json";

    public const string DefenderAssessmentCounts = "defender-assessment-counts.json";

    public const string DefenderSecurityContacts = "defender-security-contacts.json";

    public const string DefenderGovernance = "defender-governance.json";

    public const string DefenderComplianceStandards = "defender-compliance-standards.json";

    public const string DefenderComplianceControls = "defender-compliance-controls.json";

    public const string DefenderAlerts = "defender-alerts.json";

    public const string DefenderAttackPaths = "defender-attack-paths.json";

    public const string DefenderVulnerabilityCounts = "defender-vulnerability-counts.json";

    public const string DefenderVulnerabilityFindings = "defender-vulnerability-findings.json";

    public const string EffectiveNetworkControls = "effective-network-controls.json";

    public const string AdfLinkedServices = "adf-linked-services.json";

    public const string AdfDatasets = "adf-datasets.json";

    public const string AdfPipelineFlows = "adf-pipeline-flows.json";

    public const string AdfTriggers = "adf-triggers.json";

    public const string AdfIntegrationRuntimes = "adf-integration-runtimes.json";

    public const string AdfDataflows = "adf-dataflows.json";

    public const string EventGridSubscriptions = "event-grid-subscriptions.json";

    public const string LogicAppConnections = "logic-app-connections.json";

    public const string MessagingAssociations = "messaging-associations.json";

    public const string PaasChildAssociations = "paas-child-associations.json";

    public const string ServiceConnectorLinks = "service-connector-links.json";

    public const string AppSettingsHosts = "app-settings-hosts.json";

    public const string DependencyObservations = "dependency-observations.json";

    public const string SqlDatabasePrincipals = "sql-database-principals.json";

    public const string RecoveryServicesProtectedItems = "recovery-services-protected-items.json";

    public static IReadOnlyCollection<string> OptionalInventoryEntryNames { get; } =
    [
        RoleAssignments,
        DiagnosticSettings,
        NetworkAssociations,
        PolicyAssignments,
        FederatedCredentials,
        EntraGroupMemberships,
        ApplicationOwners,
        DirectoryRoleAssignments,
        GraphAppRoleAssignments,
        DefenderSummary,
        DefenderPricings,
        DefenderScoreControls,
        DefenderAssessments,
        DefenderAssessmentCounts,
        DefenderSecurityContacts,
        DefenderGovernance,
        DefenderComplianceStandards,
        DefenderComplianceControls,
        DefenderAlerts,
        DefenderAttackPaths,
        DefenderVulnerabilityCounts,
        DefenderVulnerabilityFindings,
        EffectiveNetworkControls,
        AdfLinkedServices,
        AdfDatasets,
        AdfPipelineFlows,
        AdfTriggers,
        AdfIntegrationRuntimes,
        AdfDataflows,
        EventGridSubscriptions,
        LogicAppConnections,
        MessagingAssociations,
        PaasChildAssociations,
        ServiceConnectorLinks,
        AppSettingsHosts,
        DependencyObservations,
        SqlDatabasePrincipals,
        RecoveryServicesProtectedItems,
    ];
}
