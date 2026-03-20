namespace ArchiForge.Contracts.Requests;

public class ContextDocumentRequest
{
    public string Name { get; set; } = default!;
    public string ContentType { get; set; } = "text/plain";
    public string Content { get; set; } = default!;
}
