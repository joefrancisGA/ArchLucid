namespace ArchLucid.ContextIngestion.Models.ConnectorPayloads;

public sealed class InlineRequirementsPayload
{
    public IReadOnlyList<string> InlineRequirements
    {
        get;
        init;
    } = [];
}
