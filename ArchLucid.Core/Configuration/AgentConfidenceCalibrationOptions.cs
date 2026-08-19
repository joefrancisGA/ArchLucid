namespace ArchLucid.Core.Configuration;

/// <summary>
///     Options for mapping raw agent self-reported confidence to historically observed semantic scores.
/// </summary>
public sealed class AgentConfidenceCalibrationOptions
{
    public const string SectionPath = "ArchLucid:AgentOutput:ConfidenceCalibration";

    /// <summary>When false, calibration is a no-op and <see cref="CalibratedConfidence" /> is not written.</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>Maximum historical (rawConfidence, semanticScore) pairs loaded per <see cref="Contracts.Common.AgentType" />.</summary>
    public int SampleCount
    {
        get;
        set;
    } = 200;

    /// <summary>Minimum samples required before a non-identity calibration curve is applied (TB-180 fail-open).</summary>
    public int MinimumSamplesForCalibration
    {
        get;
        set;
    } = 20;
}
