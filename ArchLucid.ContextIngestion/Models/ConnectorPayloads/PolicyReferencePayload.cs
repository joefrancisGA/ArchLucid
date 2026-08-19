namespace ArchLucid.ContextIngestion.Models.ConnectorPayloads;

public sealed class PolicyReferencePayload
{
    public IReadOnlyList<string> PolicyReferences
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> TopologyHints
    {
        get;
        init;
    } = [];
}
