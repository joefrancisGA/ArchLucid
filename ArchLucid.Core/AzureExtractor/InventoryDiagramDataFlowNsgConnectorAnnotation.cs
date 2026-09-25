namespace ArchLucid.Core.AzureExtractor;

/// <summary>Effective NSG annotation for one proven data-flow connector (NR-08).</summary>
public sealed class InventoryDiagramDataFlowNsgConnectorAnnotation
{
    public bool IsBlocked
    {
        get;
        init;
    }

    public IReadOnlyList<string> ConnectorDisplayLabels
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> SupportingRuleDetailLines
    {
        get;
        init;
    } = [];

    public IReadOnlyList<InventoryDiagramDataFlowNsgDirectionalEvaluation> DirectionalEvaluations
    {
        get;
        init;
    } = [];
}
