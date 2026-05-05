namespace ArchLucid.ContextIngestion.Models.ConnectorPayloads;

public sealed class SecurityBaselineHintsPayload
{
    public IReadOnlyList<string> SecurityBaselineHints
    {
        get;
        init;
    } = [];
}
