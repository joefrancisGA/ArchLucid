namespace ArchLucid.Decisioning.Findings;

/// <summary>Per-engine gate score vs human novelty calibration row (DX-67).</summary>
public sealed class InsightDensityGateHumanCalibrationRow
{
    public string EngineType
    {
        get;
        set;
    } = null!;

    public int FindingCount
    {
        get;
        set;
    }

    public int DecisionGradeCount
    {
        get;
        set;
    }

    public int MedianScore
    {
        get;
        set;
    }

    public int DidNotThinkOfThatCount
    {
        get;
        set;
    }

    public double? NoveltyRate
    {
        get;
        set;
    }

    public double? Residual
    {
        get;
        set;
    }
}
