namespace ArchLucid.Contracts.Architecture;

public sealed class DiagramInfrastructureCorrespondenceRow
{
    public string CorrespondenceId
    {
        get;
        set;
    } = string.Empty;

    public string? DiagramNodeId
    {
        get;
        set;
    }

    public string? DiagramNodeLabel
    {
        get;
        set;
    }

    public Guid? CloudResourceId
    {
        get;
        set;
    }

    public string? AzureResourceId
    {
        get;
        set;
    }

    public string? ResourceType
    {
        get;
        set;
    }

    public string? ResourceGroup
    {
        get;
        set;
    }

    public string? TerraformAddress
    {
        get;
        set;
    }

    public string MatchKind
    {
        get;
        set;
    } = DiagramInfrastructureMatchKinds.Unknown;

    public string ConfidenceBand
    {
        get;
        set;
    } = DiagramInfrastructureConfidenceBands.InsufficientEvidence;

    public string ExplainText
    {
        get;
        set;
    } = string.Empty;

    public string? AiRationale
    {
        get;
        set;
    }

    public bool SecurityDiscrepancy
    {
        get;
        set;
    }
}
