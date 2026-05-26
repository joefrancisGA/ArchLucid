namespace ArchLucid.Contracts.Admin;

/// <summary>Effective agent output quality gate floors for operator diagnostics (no secrets).</summary>
public sealed class AdminQualityGateDiagnosticsResponse
{
    public bool Enabled
    {
        get;
        init;
    }

    public string Mode
    {
        get;
        init;
    } = string.Empty;

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

    public double PilotStrictMinStructuralCompleteness
    {
        get;
        init;
    }

    public double PilotStrictMinSemanticScore
    {
        get;
        init;
    }

    public int PilotStrictMinEvidenceRefCount
    {
        get;
        init;
    }

    public double? PilotStrictMinFaithfulnessSupportRatio
    {
        get;
        init;
    }

    public double? PilotStrictMinAgentResultFaithfulnessSupportRatio
    {
        get;
        init;
    }

    public bool EnforceOnReject
    {
        get;
        init;
    }

    public bool BlockRunOnReject
    {
        get;
        init;
    }
}
