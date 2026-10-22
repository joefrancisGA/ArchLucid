namespace ArchLucid.Contracts.Requests;

public class ContextDocumentRequest
{
    public string Name
    {
        get;
        set;
    } = null!;

    /// <summary>
    ///     MIME type from <see cref="ArchLucid.ContextIngestion.SupportedContextDocumentContentTypes.All" /> —
    ///     see <c>docs/library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md</c>. Image/* types are forbidden.
    /// </summary>
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
