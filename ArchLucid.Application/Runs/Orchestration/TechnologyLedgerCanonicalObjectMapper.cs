using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Maps infrastructure-ingestion <see cref="CanonicalObject" /> rows to Technology Ledger evidence candidates.
/// </summary>
public static class TechnologyLedgerCanonicalObjectMapper
{
    /// <summary>Builds an IaC-tooling ledger candidate from a declaration format string.</summary>
    public static TechnologyLedgerEntry BuildIacTargetEntry(
        string declarationFormat,
        string declarationId,
        string declarationName,
        string runId,
        DateTime utcNow)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(declarationFormat);
        ArgumentException.ThrowIfNullOrWhiteSpace(declarationId);
        ArgumentException.ThrowIfNullOrWhiteSpace(declarationName);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return new TechnologyLedgerEntry
        {
            RunId = runId,
            Role = TechnologyLedgerRole.IacTarget,
            TechnologyName = ResolveIacTargetTechnologyName(declarationFormat),
            ProviderFamily = CloudProvider.None,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.Evidence,
            EvidenceRef = $"infrastructureDeclaration:{declarationId}",
            Rationale = $"Derived from infrastructure declaration '{declarationName}'.",
            IsLocked = false,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };
    }

    /// <summary>
    ///     Maps one canonical object to zero or more evidence ledger candidates (resource role + optional region).
    /// </summary>
    public static IReadOnlyList<TechnologyLedgerEntry> MapCanonicalObject(
        CanonicalObject canonicalObject,
        string runId,
        DateTime utcNow)
    {
        ArgumentNullException.ThrowIfNull(canonicalObject);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        List<TechnologyLedgerEntry> candidates = [];
        string typeKey = ResolveTypeKey(canonicalObject);
        CloudProvider providerFamily = InferProviderFamily(
            typeKey,
            TryGetProperty(canonicalObject, "providerName"));

        TechnologyLedgerRole? role = TryResolveResourceRole(typeKey);

        if (role is not null)
        {
            candidates.Add(new TechnologyLedgerEntry
            {
                RunId = runId,
                Role = role.Value,
                TechnologyName = BuildTechnologyName(typeKey, canonicalObject.Name),
                ProviderFamily = providerFamily,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.Evidence,
                EvidenceRef = $"infrastructureDeclaration:{canonicalObject.SourceId}",
                Rationale = $"Derived from infrastructure declaration object '{canonicalObject.Name}'.",
                IsLocked = false,
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
            });
        }

        string? region = TryResolveRegion(canonicalObject);

        if (!string.IsNullOrWhiteSpace(region))
        {
            candidates.Add(new TechnologyLedgerEntry
            {
                RunId = runId,
                Role = TechnologyLedgerRole.Region,
                TechnologyName = region,
                ProviderFamily = providerFamily,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.Evidence,
                EvidenceRef = $"infrastructureDeclaration:{canonicalObject.SourceId}",
                Rationale = $"Region inferred from infrastructure declaration object '{canonicalObject.Name}'.",
                IsLocked = false,
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
            });
        }

        return candidates;
    }

    /// <summary>Infer cloud provider family from terraform/json type keys and optional provider name.</summary>
    public static CloudProvider InferProviderFamily(string typeKey, string? providerName)
    {
        string normalizedType = typeKey.Trim();

        if (normalizedType.StartsWith("azurerm_", StringComparison.OrdinalIgnoreCase)
            || normalizedType.StartsWith("azure", StringComparison.OrdinalIgnoreCase))
        {
            return CloudProvider.Azure;
        }

        if (normalizedType.StartsWith("aws_", StringComparison.OrdinalIgnoreCase))
            return CloudProvider.Aws;

        if (normalizedType.StartsWith("google_", StringComparison.OrdinalIgnoreCase)
            || normalizedType.StartsWith("gcp_", StringComparison.OrdinalIgnoreCase))
        {
            return CloudProvider.Gcp;
        }

        if (string.IsNullOrWhiteSpace(providerName))
            return CloudProvider.None;

        string normalizedProvider = providerName.Trim();

        if (normalizedProvider.Contains("azurerm", StringComparison.OrdinalIgnoreCase)
            || normalizedProvider.Contains("azure", StringComparison.OrdinalIgnoreCase))
        {
            return CloudProvider.Azure;
        }

        if (normalizedProvider.Contains("aws", StringComparison.OrdinalIgnoreCase))
            return CloudProvider.Aws;

        if (normalizedProvider.Contains("google", StringComparison.OrdinalIgnoreCase))
            return CloudProvider.Gcp;

        return CloudProvider.None;
    }

    /// <summary>Build a cloud-platform candidate from Azure extractor package provenance.</summary>
    public static TechnologyLedgerEntry BuildAzureInventoryCloudPlatformEntry(
        Guid packageId,
        string? originalFileName,
        string runId,
        DateTime utcNow)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        string rationale = string.IsNullOrWhiteSpace(originalFileName)
            ? "Derived from Azure cloud inventory extractor package linked to this run."
            : $"Derived from Azure cloud inventory package '{originalFileName}'.";

        return new TechnologyLedgerEntry
        {
            RunId = runId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = "Microsoft Azure",
            ProviderFamily = CloudProvider.Azure,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.Evidence,
            EvidenceRef = $"azureExtractorPackage:{packageId:N}",
            Rationale = rationale,
            IsLocked = false,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };
    }

    /// <summary>Build a cloud-platform candidate from AWS/GCP inventory package provenance.</summary>
    public static TechnologyLedgerEntry BuildCloudInventoryCloudPlatformEntry(
        CloudProvider cloudProvider,
        Guid packageId,
        string? originalFileName,
        string runId,
        DateTime utcNow)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (cloudProvider is not (CloudProvider.Aws or CloudProvider.Gcp))
        {
            throw new ArgumentOutOfRangeException(
                nameof(cloudProvider),
                cloudProvider,
                "Only Aws and Gcp inventory packages are supported.");
        }

        string technologyName = cloudProvider switch
        {
            CloudProvider.Aws => "Amazon Web Services",
            CloudProvider.Gcp => "Google Cloud Platform",
            _ => throw new ArgumentOutOfRangeException(nameof(cloudProvider), cloudProvider, null),
        };

        string rationale = string.IsNullOrWhiteSpace(originalFileName)
            ? $"Derived from {cloudProvider} cloud inventory package linked to this run."
            : $"Derived from {cloudProvider} cloud inventory package '{originalFileName}'.";

        return new TechnologyLedgerEntry
        {
            RunId = runId,
            Role = TechnologyLedgerRole.CloudPlatform,
            TechnologyName = technologyName,
            ProviderFamily = cloudProvider,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.Evidence,
            EvidenceRef = $"cloudInventoryPackage:{cloudProvider}:{packageId:N}",
            Rationale = rationale,
            IsLocked = false,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };
    }

    private static string ResolveIacTargetTechnologyName(string declarationFormat) => declarationFormat switch
    {
        "terraform-show-json" => "Terraform",
        "json" => "ArchLucid JSON infrastructure declaration",
        _ => declarationFormat,
    };

    private static string ResolveTypeKey(CanonicalObject canonicalObject)
    {
        if (TryGetProperty(canonicalObject, "terraformType") is { Length: > 0 } terraformType)
            return terraformType;

        if (TryGetProperty(canonicalObject, "resourceType") is { Length: > 0 } resourceType)
            return resourceType;

        return canonicalObject.ObjectType;
    }

    private static TechnologyLedgerRole? TryResolveResourceRole(string typeKey)
    {
        string normalized = typeKey.Trim().ToLowerInvariant();

        if (IsPrimaryDatastoreType(normalized))
            return TechnologyLedgerRole.PrimaryDatastore;

        if (IsIdentityType(normalized))
            return TechnologyLedgerRole.IdentityProvider;

        if (IsMessagingType(normalized))
            return TechnologyLedgerRole.Messaging;

        if (IsComputeType(normalized))
            return TechnologyLedgerRole.ComputeRuntime;

        return null;
    }

    private static bool IsPrimaryDatastoreType(string normalized) =>
        normalized is "database" or "datastore"
        || normalized.StartsWith("azurerm_sql", StringComparison.Ordinal)
        || normalized.StartsWith("azurerm_mssql", StringComparison.Ordinal)
        || normalized is "aws_db_instance" or "aws_rds_cluster"
        || normalized is "google_sql_database_instance";

    private static bool IsIdentityType(string normalized) =>
        normalized is "identity"
        || normalized.StartsWith("azurerm_key_vault", StringComparison.Ordinal)
        || normalized.StartsWith("aws_iam", StringComparison.Ordinal)
        || normalized.Contains("service_account", StringComparison.Ordinal);

    private static bool IsMessagingType(string normalized) =>
        normalized.StartsWith("azurerm_servicebus", StringComparison.Ordinal)
        || normalized.StartsWith("aws_sqs", StringComparison.Ordinal)
        || normalized.StartsWith("aws_sns", StringComparison.Ordinal)
        || normalized.StartsWith("google_pubsub", StringComparison.Ordinal)
        || normalized is "messaging";

    private static bool IsComputeType(string normalized) =>
        normalized is "compute" or "appservice" or "container"
        || normalized.Contains("web_app", StringComparison.Ordinal)
        || normalized.StartsWith("aws_lambda", StringComparison.Ordinal)
        || normalized.StartsWith("aws_eks", StringComparison.Ordinal)
        || normalized is "google_container_cluster";

    private static string? TryResolveRegion(CanonicalObject canonicalObject)
    {
        if (TryGetProperty(canonicalObject, "region") is { Length: > 0 } region)
            return region;

        if (TryGetProperty(canonicalObject, "tf.location") is { Length: > 0 } location)
            return location;

        if (TryGetProperty(canonicalObject, "tf.region") is { Length: > 0 } tfRegion)
            return tfRegion;

        return null;
    }

    private static string BuildTechnologyName(string typeKey, string objectName) =>
        $"{typeKey} ({objectName})";

    private static string? TryGetProperty(CanonicalObject canonicalObject, string key)
    {
        if (!canonicalObject.Properties.TryGetValue(key, out string? value))
            return null;

        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
