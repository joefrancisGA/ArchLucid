using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Import;

/// <summary>
///     Maps parsed CSV component rows to a <see cref="GoldenManifest" /> skeleton (dry-run only).
/// </summary>
internal static class ArchitectureCsvToGoldenManifestDryRunMapper
{
    internal static GoldenManifest Build(
        IReadOnlyList<ArchitectureCsvComponentRow> rows,
        string runId,
        string systemName)
    {
        List<ManifestService> services = [];
        List<ManifestDatastore> datastores = [];

        foreach (ArchitectureCsvComponentRow row in rows)
        {

            if (IsDatastoreRow(row.TypeToken, row.ComponentName))
                datastores.Add(MapDatastore(row));
            else
                services.Add(MapService(row));
        }

        return new GoldenManifest
        {
            RunId = runId,
            SystemName = systemName,
            Services = services,
            Datastores = datastores,
            Relationships = [],
            Governance = new ManifestGovernance(),
            Metadata = new ManifestMetadata
            {
                ManifestVersion = "dry-run-csv-import",
                ChangeDescription = "Dry-run import from external CSV (not persisted).",
                CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
            },
        };
    }

    private static bool IsDatastoreRow(string typeToken, string componentName)
    {
        string combined = (typeToken + " " + componentName).ToUpperInvariant();

        if (combined.Contains("DATASTORE", StringComparison.Ordinal))
            return true;

        if (combined.Contains("DATABASE", StringComparison.Ordinal) || combined.Contains("DB ", StringComparison.Ordinal))
            return true;

        if (combined.Contains("SQL", StringComparison.Ordinal) && !combined.Contains("API", StringComparison.Ordinal))
            return true;

        if (combined.Contains("BLOB", StringComparison.Ordinal)
            || combined.Contains("STORAGE ACCOUNT", StringComparison.Ordinal))
            return true;

        if (combined.Contains("CACHE", StringComparison.Ordinal) || combined.Contains("REDIS", StringComparison.Ordinal))
            return true;

        if (combined.Contains("COSMOS", StringComparison.Ordinal))
            return true;

        return false;
    }

    private static ManifestService MapService(ArchitectureCsvComponentRow row)
    {
        string hint = $"{row.TypeToken} {row.ComponentName} {row.Description}";

        return new ManifestService
        {
            ServiceId = Guid.NewGuid().ToString("N"),
            ServiceName = row.ComponentName,
            ServiceType = InferServiceType(row.TypeToken, hint),
            RuntimePlatform = InferRuntimePlatform(hint, asDatastore: false),
            Purpose = string.IsNullOrWhiteSpace(row.Description) ? null : row.Description.Trim(),
        };
    }

    private static ManifestDatastore MapDatastore(ArchitectureCsvComponentRow row)
    {
        string hint = $"{row.TypeToken} {row.ComponentName} {row.Description}";

        return new ManifestDatastore
        {
            DatastoreId = Guid.NewGuid().ToString("N"),
            DatastoreName = row.ComponentName,
            DatastoreType = InferDatastoreType(row.TypeToken, hint),
            RuntimePlatform = InferRuntimePlatform(hint, asDatastore: true),
            Purpose = string.IsNullOrWhiteSpace(row.Description) ? null : row.Description.Trim(),
        };
    }

    private static ServiceType InferServiceType(string typeToken, string hintUpper)
    {
        string t = typeToken.ToUpperInvariant();

        if (t.Contains("UI", StringComparison.Ordinal) || t.Contains("WEB", StringComparison.Ordinal))
            return ServiceType.Ui;

        if (t.Contains("WORKER", StringComparison.Ordinal) || t.Contains("JOB", StringComparison.Ordinal))
            return ServiceType.Worker;

        if (t.Contains("INTEGRATION", StringComparison.Ordinal) || t.Contains("ADAPTER", StringComparison.Ordinal))
            return ServiceType.Integration;

        if (t.Contains("DATA", StringComparison.Ordinal) && t.Contains("SERVICE", StringComparison.Ordinal))
            return ServiceType.DataService;

        if (t.Contains("SEARCH", StringComparison.Ordinal))
            return ServiceType.SearchService;

        if (t.Contains("AI", StringComparison.Ordinal)
            || t.Contains("LLM", StringComparison.Ordinal)
            || t.Contains("MODEL", StringComparison.Ordinal))
            return ServiceType.AiService;

        if (t.Contains("API", StringComparison.Ordinal))
            return ServiceType.Api;

        string h = hintUpper.ToUpperInvariant();

        if (h.Contains("FRONT", StringComparison.Ordinal) || h.Contains("SPA", StringComparison.Ordinal))
            return ServiceType.Ui;

        return ServiceType.Unknown;
    }

    private static DatastoreType InferDatastoreType(string typeToken, string hint)
    {
        string combined = (typeToken + " " + hint).ToUpperInvariant();

        if (combined.Contains("BLOB", StringComparison.Ordinal) || combined.Contains("OBJECT", StringComparison.Ordinal))
            return DatastoreType.Object;

        if (combined.Contains("CACHE", StringComparison.Ordinal) || combined.Contains("REDIS", StringComparison.Ordinal))
            return DatastoreType.Cache;

        if (combined.Contains("SEARCH", StringComparison.Ordinal)
            || combined.Contains("INDEX", StringComparison.Ordinal)
            || combined.Contains("VECTOR", StringComparison.Ordinal))
            return DatastoreType.Search;

        if (combined.Contains("NOSQL", StringComparison.Ordinal)
            || combined.Contains("DOCUMENT", StringComparison.Ordinal)
            || combined.Contains("COSMOS", StringComparison.Ordinal))
            return DatastoreType.NoSql;

        if (combined.Contains("SQL", StringComparison.Ordinal)
            || combined.Contains("RELATIONAL", StringComparison.Ordinal)
            || combined.Contains("DATABASE", StringComparison.Ordinal)
            || combined.Contains("DB", StringComparison.Ordinal))
            return DatastoreType.Sql;

        return DatastoreType.Unknown;
    }

    private static RuntimePlatform InferRuntimePlatform(string hint, bool asDatastore)
    {
        string h = hint.ToUpperInvariant();

        if (h.Contains("APP SERVICE", StringComparison.Ordinal)
            || h.Contains("APPSERVICE", StringComparison.Ordinal)
            || h.Contains("WEB APP", StringComparison.Ordinal))
            return RuntimePlatform.AppService;

        if (h.Contains("FUNCTION", StringComparison.Ordinal) || h.Contains("SERVERLESS", StringComparison.Ordinal))
            return RuntimePlatform.Functions;

        if (h.Contains("AKS", StringComparison.Ordinal) || h.Contains("KUBERNETES", StringComparison.Ordinal))
            return RuntimePlatform.Aks;

        if (h.Contains("VM", StringComparison.Ordinal) || h.Contains("VIRTUAL MACHINE", StringComparison.Ordinal))
            return RuntimePlatform.Vm;

        if (h.Contains("CONTAINER APP", StringComparison.Ordinal))
            return RuntimePlatform.ContainerApps;

        if (h.Contains("SQL", StringComparison.Ordinal) || h.Contains("MANAGED INSTANCE", StringComparison.Ordinal))
            return RuntimePlatform.SqlServer;

        if (h.Contains("AI SEARCH", StringComparison.Ordinal)
            || h.Contains("COGNITIVE SEARCH", StringComparison.Ordinal)
            || h.Contains("AZURE SEARCH", StringComparison.Ordinal))
            return RuntimePlatform.AzureAiSearch;

        if (h.Contains("OPENAI", StringComparison.Ordinal))
            return RuntimePlatform.AzureOpenAi;

        if (h.Contains("REDIS", StringComparison.Ordinal))
            return RuntimePlatform.Redis;

        if (h.Contains("BLOB", StringComparison.Ordinal) || h.Contains("STORAGE", StringComparison.Ordinal))
            return RuntimePlatform.BlobStorage;

        if (h.Contains("KEY VAULT", StringComparison.Ordinal) || h.Contains("KEYVAULT", StringComparison.Ordinal))
            return RuntimePlatform.KeyVault;

        if (asDatastore && h.Contains("DATABASE", StringComparison.Ordinal))
            return RuntimePlatform.SqlServer;

        return RuntimePlatform.Unknown;
    }
}
