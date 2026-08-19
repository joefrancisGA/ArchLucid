namespace ArchLucid.ContextIngestion.Models.ConnectorPayloads;

public sealed class TopologyHintsPayload
{
    public IReadOnlyList<string> TopologyHints
    {
        get;
        init;
    } = [];
}
