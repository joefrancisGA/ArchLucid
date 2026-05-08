namespace ArchLucid.Application.AzureExtractor;

/// <summary>Outcome of <see cref="IAzureExtractorIngestService.IngestZipAsync" />.</summary>
public sealed class AzureExtractorIngestResult
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
}
