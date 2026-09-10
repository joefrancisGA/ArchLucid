namespace ArchLucid.Core.Findings;

/// <summary>Premium judge apply telemetry for skip-by-cap and budget-shrunk cap (DX-62).</summary>
public sealed class InsightDensityLlmJudgeApplyResult
{
    public static InsightDensityLlmJudgeApplyResult None { get; } = new(0, null, null);

    public InsightDensityLlmJudgeApplyResult(int skippedByCap, int? judgeConfiguredCap, int? judgeEffectiveCap)
    {
        SkippedByCap = skippedByCap;
        JudgeConfiguredCap = judgeConfiguredCap;
        JudgeEffectiveCap = judgeEffectiveCap;
    }

    public int SkippedByCap
    {
        get;
    }

    /// <summary>Set when effective cap is below configured cap after remaining-budget shrink.</summary>
    public int? JudgeConfiguredCap
    {
        get;
    }

    /// <summary>Set when effective cap is below configured cap after remaining-budget shrink.</summary>
    public int? JudgeEffectiveCap
    {
        get;
    }
}
