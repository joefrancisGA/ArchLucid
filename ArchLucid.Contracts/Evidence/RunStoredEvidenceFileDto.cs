namespace ArchLucid.Contracts.Evidence;

/// <summary>Buyer-visible metadata for one stored evidence file on a review run (no blob URI).</summary>
public sealed class RunStoredEvidenceFileDto
{
    public string EvidenceItemId
    {
        get;
        set;
    } = "";

    public string OriginalFileName
    {
        get;
        set;
    } = "";

    public string ContentType
    {
        get;
        set;
    } = "";

    public long ByteLength
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }
}
