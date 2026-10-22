namespace ArchLucid.ContextIngestion.Diagram;

public sealed class DrawIoXmlPayloadExpandResult
{
    public string XmlPayload
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
