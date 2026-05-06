namespace ArchLucid.Persistence.Models;

/// <summary>
/// Lightweight read model for grounding cost/evidence citations without loading ZIP bytes.
/// </summary>
public sealed class AzureExtractorPackageProvenance
{
    public Guid PackageId
    {
        get;
        init;
    }

    public int SchemaVersion
    {
        get;
        init;
    }

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

    public string? SubscriptionId
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
    public static AzureExtractorPackageProvenance FromRecord(AzureExtractorPackageRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        return new AzureExtractorPackageProvenance
        {
            PackageId = record.PackageId,

            SchemaVersion = record.SchemaVersion,

            CollectionTimestampUtc = record.CollectionTimestampUtc.HasValue ? DateTime.SpecifyKind(record.CollectionTimestampUtc.Value, DateTimeKind.Utc) : null,

            CreatedUtc = record.CreatedUtc.Kind == DateTimeKind.Utc ? record.CreatedUtc : record.CreatedUtc.ToUniversalTime(),

            SubscriptionId = record.SubscriptionId,

            OriginalFileName = record.OriginalFileName,
        };
    }
}
