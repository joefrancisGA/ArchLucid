using ArchLucid.Contracts.Common;

namespace ArchLucid.Persistence.Models;

/// <summary>
///     Lightweight read model for AWS/GCP inventory package citations without loading ZIP bytes.
/// </summary>
public sealed class CloudInventoryExtractorPackageProvenance
{
    public Guid PackageId
    {
        get;
        init;
    }

    public CloudProvider CloudProvider
    {
        get;
        init;
    }

    public int SchemaVersion
    {
        get;
        init;
    }

    public string ScopeId
    {
        get;
        init;
    } = string.Empty;

    /// <summary>UTC collection stamp from manifest; may be absent on legacy rows.</summary>
    public DateTime? CollectionTimestampUtc
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public string OriginalFileName
    {
        get;
        init;
    } = string.Empty;

    /// <inheritdoc cref="CollectionTimestampUtc" />
    public DateTime EffectiveCollectionUtc => CollectionTimestampUtc ?? CreatedUtc;

    /// <summary>Build from a persisted ingest row.</summary>
    public static CloudInventoryExtractorPackageProvenance FromRecord(CloudInventoryExtractorPackageRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        return new CloudInventoryExtractorPackageProvenance
        {
            PackageId = record.PackageId,
            CloudProvider = record.CloudProvider,
            SchemaVersion = record.SchemaVersion,
            ScopeId = record.ScopeId,
            CollectionTimestampUtc =
                record.CollectionTimestampUtc.HasValue
                    ? DateTime.SpecifyKind(record.CollectionTimestampUtc.Value, DateTimeKind.Utc)
                    : null,
            CreatedUtc = record.CreatedUtc.Kind == DateTimeKind.Utc ? record.CreatedUtc : record.CreatedUtc.ToUniversalTime(),
            OriginalFileName = record.OriginalFileName,
        };
    }
}
