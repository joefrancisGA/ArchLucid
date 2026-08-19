using ArchLucid.Contracts.Common;

namespace ArchLucid.ArtifactSynthesis.Validation;

/// <summary>
///     Curated hyperscaler product phrases scanned during Technology Ledger artifact prose lint (assessment D.5).
/// </summary>
public static class TechnologyLedgerProseTokenCatalog
{
    public static IReadOnlyList<ProseTokenDefinition> AllTokens { get; } =
    [
        new ProseTokenDefinition(CloudProvider.Azure, "Azure SQL"),
        new ProseTokenDefinition(CloudProvider.Azure, "Cosmos DB"),
        new ProseTokenDefinition(CloudProvider.Azure, "App Service"),
        new ProseTokenDefinition(CloudProvider.Azure, "Key Vault"),
        new ProseTokenDefinition(CloudProvider.Azure, "Entra ID"),
        new ProseTokenDefinition(CloudProvider.Azure, "Azure AD"),
        new ProseTokenDefinition(CloudProvider.Azure, "Service Bus"),
        new ProseTokenDefinition(CloudProvider.Azure, "Event Hubs"),
        new ProseTokenDefinition(CloudProvider.Azure, "Blob Storage"),
        new ProseTokenDefinition(CloudProvider.Azure, "AKS"),
        new ProseTokenDefinition(CloudProvider.Azure, "Azure"),
        new ProseTokenDefinition(CloudProvider.Aws, "Amazon RDS"),
        new ProseTokenDefinition(CloudProvider.Aws, "DynamoDB"),
        new ProseTokenDefinition(CloudProvider.Aws, "Cognito"),
        new ProseTokenDefinition(CloudProvider.Aws, "Lambda"),
        new ProseTokenDefinition(CloudProvider.Aws, "AWS"),
        new ProseTokenDefinition(CloudProvider.Aws, "Amazon"),
        new ProseTokenDefinition(CloudProvider.Aws, "S3"),
        new ProseTokenDefinition(CloudProvider.Gcp, "Google Cloud"),
        new ProseTokenDefinition(CloudProvider.Gcp, "Cloud Run"),
        new ProseTokenDefinition(CloudProvider.Gcp, "Firestore"),
        new ProseTokenDefinition(CloudProvider.Gcp, "Cloud SQL"),
        new ProseTokenDefinition(CloudProvider.Gcp, "Pub/Sub"),
        new ProseTokenDefinition(CloudProvider.Gcp, "BigQuery"),
        new ProseTokenDefinition(CloudProvider.Gcp, "GKE"),
        new ProseTokenDefinition(CloudProvider.Gcp, "GCP"),
    ];

    public sealed record ProseTokenDefinition(CloudProvider ProviderFamily, string Token);
}
