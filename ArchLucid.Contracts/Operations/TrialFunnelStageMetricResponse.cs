namespace ArchLucid.Contracts.Operations;

/// <summary>One funnel stage count for the selected reporting window.</summary>
public sealed class TrialFunnelStageMetricResponse
{
    public string StageId
    {
        get;
        init;
    } = string.Empty;

    public string Label
    {
        get;
        init;
    } = string.Empty;

    public int Count
    {
        get;
        init;
    }

    /// <summary>Share of trial starts in the window; null when the denominator is zero.</summary>
    public double? PercentOfTrialStarts
    {
        get;
        init;
    }

    /// <summary>Conversion from the immediately preceding stage; null when the prior stage count is zero.</summary>
    public double? PercentFromPreviousStage
    {
        get;
        init;
    }

    /// <summary>Median hours from the previous stage; null when insufficient samples.</summary>
    public double? MedianHoursFromPreviousStage
    {
        get;
        init;
    }

    public int? PreviousPeriodCount
    {
        get;
        init;
    }
}
