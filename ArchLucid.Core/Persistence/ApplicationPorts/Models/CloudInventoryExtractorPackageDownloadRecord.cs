namespace ArchLucid.Persistence.Models;

public sealed class CloudInventoryExtractorPackageDownloadRecord
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
