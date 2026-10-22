namespace ArchLucid.ContextIngestion.Diagram;

internal sealed class VsdxPackageReadResult
{
    public IReadOnlyList<string> PageXmlDocuments
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> Warnings
    {
        get;
        init;
    } = [];
}
