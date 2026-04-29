namespace ArchLucid.Contracts.Requests;

public class ContextDocumentRequest
{
    public string Name
    {
        get;
        set;
    } = null!;

    public string ContentType
    {
        get;
        set;
    } = "text/plain";

    public string Content
    {
        get;
        set;
    } = null!;

    /// <summary>Optional HTTPS URL for an external document — validated for SSRF (no private IPs, https only).</summary>
    public string? SourceDocumentUrl
    {
        get;
        set;
    }
}
