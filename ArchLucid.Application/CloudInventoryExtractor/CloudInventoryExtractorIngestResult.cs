namespace ArchLucid.Application.CloudInventoryExtractor;

/// <summary>Outcome of <see cref="ICloudInventoryExtractorIngestService.IngestZipAsync" />.</summary>
public sealed class CloudInventoryExtractorIngestResult
{
    public bool Succeeded
    {
        get;

        init;
    }

    public Guid? PackageId
    {
        get;

        init;
    }

    public string? FailureDetail
    {
        get;

        init;
    }

    public bool IsSchemaRejection
    {
        get;

        init;
    }

    public bool IsInvalidArchive
    {
        get;

        init;
    }
}
