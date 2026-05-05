namespace ArchLucid.ContextIngestion.Models;

/// <summary>
///     Raw connector-stage outputs before canonical enrichment / deduplication (Phase 2 orchestrator result).
/// </summary>
public sealed class ConnectorPipelineStagesOutcome
{
    public List<CanonicalObject> CanonicalObjects
    {
        get;
    } = [];

    public List<string> Warnings
    {
        get;
    } = [];

    public string DeltaSummary
    {
        get;
        set;
    } = string.Empty;
}
