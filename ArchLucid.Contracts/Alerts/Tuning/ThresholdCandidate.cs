namespace ArchLucid.Contracts.Alerts.Tuning;

/// <summary>
///     Identifies a single threshold value in a recommendation sweep (paired with simulation in
///     <see cref="ThresholdCandidateEvaluation" />).
/// </summary>
public class ThresholdCandidate
{
    public decimal ThresholdValue
    {
        get;
        set;
    }

    public string Label
    {
        get;
        set;
    } = null!;
}
