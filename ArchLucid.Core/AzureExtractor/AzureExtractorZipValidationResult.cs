namespace ArchLucid.Core.AzureExtractor;

/// <summary>Outcome of local Azure extractor package ZIP structure validation.</summary>
public sealed class AzureExtractorZipValidationResult
{
    public bool IsValid
    {
        get;

        init;
    }

    public string? ErrorDetail
    {
        get;

        init;
    }

    /// <summary>True when the archive bytes are not a readable ZIP.</summary>
    public bool IsInvalidArchive
    {
        get;

        init;
    }

    /// <summary>True when <c>manifest.json</c> is missing or has an unsupported <c>schemaVersion</c>.</summary>
    public bool IsSchemaRejection
    {
        get;

        init;
    }

    public int FileEntryCount
    {
        get;

        init;
    }
}
