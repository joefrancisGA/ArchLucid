namespace ArchLucid.Application.Analysis;

/// <summary>
///     Side-by-side compare verdict chrome aligned with UI compare-two-reviews delta panels (ROI batch 10).
/// </summary>
public sealed class CompareVerdictChromeDelta
{
    public CompareVerdictChromeGateOutcomeDelta? GateOutcome
    {
        get;
        set;
    }

    public CompareVerdictChromePackAssignmentDelta? PackAssignment
    {
        get;
        set;
    }

    public CompareVerdictChromeExecutionModeDelta? ExecutionMode
    {
        get;
        set;
    }

    public CompareVerdictChromeRoiHeadlineDelta? RoiHeadline
    {
        get;
        set;
    }

    public string Wk21Line
    {
        get;
        set;
    } = string.Empty;

    public string NonSummingLine
    {
        get;
        set;
    } = string.Empty;

    public bool HasAnySection =>
        GateOutcome is not null
        || PackAssignment is not null
        || ExecutionMode is not null
        || RoiHeadline is not null;
}

public sealed class CompareVerdictChromeGateOutcomeDelta
{
    public string BaselineGateLabel
    {
        get;
        set;
    } = string.Empty;

    public string TargetGateLabel
    {
        get;
        set;
    } = string.Empty;

    public bool Changed
    {
        get;
        set;
    }
}

public sealed class CompareVerdictChromePackAssignmentDelta
{
    public string BaselineSummaryLine
    {
        get;
        set;
    } = string.Empty;

    public string TargetSummaryLine
    {
        get;
        set;
    } = string.Empty;

    public bool Changed
    {
        get;
        set;
    }
}

public sealed class CompareVerdictChromeExecutionModeDelta
{
    public string BaselineModeLabel
    {
        get;
        set;
    } = string.Empty;

    public string TargetModeLabel
    {
        get;
        set;
    } = string.Empty;

    public bool Changed
    {
        get;
        set;
    }

    public string? AdvisoryParagraph
    {
        get;
        set;
    }
}

public sealed class CompareVerdictChromeRoiHeadlineDelta
{
    public string? BaselineSavingsLabel
    {
        get;
        set;
    }

    public string? TargetSavingsLabel
    {
        get;
        set;
    }
}
