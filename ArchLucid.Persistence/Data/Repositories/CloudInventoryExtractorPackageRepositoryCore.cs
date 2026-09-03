using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Shared cloud-inventory extractor package repository rules for SQL and no-op implementations.
/// </summary>
internal static class CloudInventoryExtractorPackageRepositoryCore
{
    public const string InsertSql = """
        INSERT INTO dbo.CloudInventoryExtractorPackages
        (
            PackageId, TenantId, WorkspaceId, ProjectId, RunId, CreatedUtc,
            CloudProvider, SchemaVersion, ScriptVersion, CollectionTimestampUtc,
            ScopeId, OriginalFileName, ManifestJson, PackageBytes
        )
        VALUES
        (
            @PackageId, @TenantId, @WorkspaceId, @ProjectId, @RunId, @CreatedUtc,
            @CloudProvider, @SchemaVersion, @ScriptVersion, @CollectionTimestampUtc,
            @ScopeId, @OriginalFileName, @ManifestJson, @PackageBytes
        );
        """;

    public const string DownloadByPackageIdSelectSql = """
        SELECT PackageId, RunId, OriginalFileName, PackageBytes
        FROM dbo.CloudInventoryExtractorPackages
        WHERE TenantId = @TenantId
            AND WorkspaceId = @WorkspaceId
            AND ProjectId = @ProjectId
            AND CloudProvider = @CloudProvider
            AND PackageId = @PackageId;
        """;

    public const string LatestProvenanceByRunSelectSql = """
        SELECT TOP (1)
            PackageId,
            CloudProvider,
            SchemaVersion,
            ScopeId,
            CollectionTimestampUtc,
            CreatedUtc,
            OriginalFileName
        FROM dbo.CloudInventoryExtractorPackages
        WHERE TenantId = @TenantId
            AND WorkspaceId = @WorkspaceId
            AND ProjectId = @ProjectId
            AND RunId = @RunId
            AND CloudProvider = @CloudProvider
        ORDER BY CreatedUtc DESC;
        """;

    public const string LatestCollectionTimestampSelectSql = """
        SELECT TOP (1) CollectionTimestampUtc
        FROM dbo.CloudInventoryExtractorPackages
        WHERE TenantId = @TenantId
            AND WorkspaceId = @WorkspaceId
            AND ProjectId = @ProjectId
            AND CloudProvider = @CloudProvider
            AND CollectionTimestampUtc IS NOT NULL
        ORDER BY CollectionTimestampUtc DESC, CreatedUtc DESC;
        """;

    public const string LatestDownloadInScopeSelectSql = """
        SELECT TOP (1) PackageId, RunId, OriginalFileName, PackageBytes
        FROM dbo.CloudInventoryExtractorPackages
        WHERE TenantId = @TenantId
            AND WorkspaceId = @WorkspaceId
            AND ProjectId = @ProjectId
            AND CloudProvider = @CloudProvider
        ORDER BY CreatedUtc DESC;
        """;

    public static bool IsSupportedProvider(CloudProvider cloudProvider) =>
        cloudProvider is CloudProvider.Aws or CloudProvider.Gcp;

    public static object CreateInsertArgs(CloudInventoryExtractorPackageRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        return new
        {
            record.PackageId,
            record.TenantId,
            record.WorkspaceId,
            record.ProjectId,
            record.RunId,
            record.CreatedUtc,
            CloudProvider = (int)record.CloudProvider,
            record.SchemaVersion,
            record.ScriptVersion,
            record.CollectionTimestampUtc,
            record.ScopeId,
            record.OriginalFileName,
            record.ManifestJson,
            record.PackageBytes,
        };
    }

    public static object CreateScopeProviderArgs(ScopeContext scope, CloudProvider cloudProvider) =>
        new
        {
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            CloudProvider = (int)cloudProvider,
        };

    public static CloudInventoryExtractorPackageProvenance MapProvenance(CloudInventoryExtractorPackageProvenanceRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        return new CloudInventoryExtractorPackageProvenance
        {
            PackageId = row.PackageId,
            CloudProvider = (CloudProvider)row.CloudProvider,
            SchemaVersion = row.SchemaVersion,
            ScopeId = row.ScopeId ?? string.Empty,
            CollectionTimestampUtc = row.CollectionTimestampUtc,
            CreatedUtc = row.CreatedUtc,
            OriginalFileName = row.OriginalFileName ?? string.Empty,
        };
    }

    public static CloudInventoryExtractorPackageDownloadRecord? MapDownload(
        CloudInventoryExtractorPackageDownloadRow? row)
    {
        if (row is null || row.PackageId == Guid.Empty)
            return null;

        return new CloudInventoryExtractorPackageDownloadRecord
        {
            PackageId = row.PackageId,
            RunId = row.RunId,
            OriginalFileName = row.OriginalFileName ?? string.Empty,
            PackageBytes = row.PackageBytes ?? [],
        };
    }

    public static DateTime? NormalizeCollectionTimestampUtc(DateTime? value) =>
        value is null ? null : DateTime.SpecifyKind(value.Value, DateTimeKind.Utc);
}

internal sealed class CloudInventoryExtractorPackageDownloadRow
{
    public Guid PackageId
    {
        get;
        set;
    }

    public Guid? RunId
    {
        get;
        set;
    }

    public string? OriginalFileName
    {
        get;
        set;
    }

    public byte[]? PackageBytes
    {
        get;
        set;
    }
}

internal sealed class CloudInventoryExtractorPackageProvenanceRow
{
    public Guid PackageId
    {
        get;
        set;
    }

    public int CloudProvider
    {
        get;
        set;
    }

    public int SchemaVersion
    {
        get;
        set;
    }

    public string? ScopeId
    {
        get;
        set;
    }

    public DateTime? CollectionTimestampUtc
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public string? OriginalFileName
    {
        get;
        set;
    }
}
