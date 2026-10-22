namespace ArchLucid.ContextIngestion.Diagram;

public sealed class SvgDiagramSanitizeResult
{
    public string SanitizedContent
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<string> Warnings
    {
        get;
        init;
    } = [];
}
