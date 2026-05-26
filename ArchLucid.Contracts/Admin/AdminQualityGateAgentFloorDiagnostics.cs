namespace ArchLucid.Contracts.Admin;

/// <summary>Effective warn/reject floors for one agent type after global and override merge.</summary>
public sealed class AdminQualityGateAgentFloorDiagnostics
{
    public string AgentType
    {
        get;
        init;
    } = string.Empty;

    public bool HasPerAgentOverride
    {
        get;
        init;
    }

    public double StructuralWarnBelow
    {
        get;
        init;
    }

    public double StructuralRejectBelow
    {
        get;
        init;
    }

    public double SemanticWarnBelow
    {
        get;
        init;
    }

    public double SemanticRejectBelow
    {
        get;
        init;
    }
}
