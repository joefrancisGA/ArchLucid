namespace ArchLucid.Application.AzureExtractor;

/// <summary>JSON body for <c>POST /v1/azure-extractor/upload-sessions</c>.</summary>
public sealed class AzureExtractorChunkUploadStartBody
{
    public string FileName
    {
        get;
        set;
    } = "";

    public int TotalChunks
    {
        get;
        set;
    }

    public long? TotalBytes
    {
        get;
        set;
    }
}
