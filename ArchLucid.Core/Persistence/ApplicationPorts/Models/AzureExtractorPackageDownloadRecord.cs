namespace ArchLucid.Persistence.Models;

/// <summary>Scoped Azure extractor package payload for operator download.</summary>
public sealed class AzureExtractorPackageDownloadRecord
{
    public Guid PackageId
    {
        get;
        init;
    }

    public Guid? RunId
    {
        get;
        init;
    }

    public string OriginalFileName
    {
        get;
        init;
    } = string.Empty;

    public byte[] PackageBytes
    {
        get;
        init;
    } = [];
}
