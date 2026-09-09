namespace ArchLucid.Application.Evidence;

/// <summary>Decoded bytes for one catalogued evidence file on a review run.</summary>
public sealed class RunStoredEvidenceFileContentResult
{
    public byte[] Bytes
    {
        get;
        set;
    } = [];

    public string ContentType
    {
        get;
        set;
    } = "";

    public string OriginalFileName
    {
        get;
        set;
    } = "";
}
