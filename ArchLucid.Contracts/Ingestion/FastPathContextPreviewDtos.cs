namespace ArchLucid.Contracts.Ingestion;

/// <summary>POST body for <c>POST /v1/architecture/fast-path/context-preview</c>.</summary>
public sealed class FastPathContextPreviewRequest
{
    /// <summary>Absolute http(s) URL for a source repository (Git host or archive path).</summary>
    public string RepositoryUrl
    {
        get;
        set;
    } = string.Empty;
}

/// <summary>Single element in a shallow C4-style context preview (heuristic, not a full ingest).</summary>
public sealed class FastPathContextElementDto
{
    public string ElementId
    {
        get;
        set;
    } = string.Empty;

    public string Name
    {
        get;
        set;
    } = string.Empty;

    /// <summary>C4-ish label, e.g. <c>SoftwareSystem</c>, <c>Container</c>.</summary>
    public string Kind
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Why this element was included (always heuristic for fast-path).</summary>
    public string ReasoningTrace
    {
        get;
        set;
    } = string.Empty;
}

/// <summary>Shallow context model returned without cloning or deep semantic analysis.</summary>
public sealed class FastPathContextPreviewResponse
{
    public string SourceUrl
    {
        get;
        set;
    } = string.Empty;

    public IReadOnlyList<FastPathContextElementDto> Elements
    {
        get;
        set;
    } = Array.Empty<FastPathContextElementDto>();

    /// <summary>Version tag for clients that cache previews.</summary>
    public string Mode
    {
        get;
        set;
    } = "heuristic-v1";
}
