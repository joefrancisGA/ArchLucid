namespace ArchLucid.Persistence.WeeklyDigest;

/// <summary>Approximate totals plus a capped sample slice for digest logging.</summary>
public sealed class WeeklyArchitectureCriticalFindingsSlice
{
    /// <summary>Exact count of matching relational rows matching the cutoff + severity (+ active snapshot filters).</summary>
    public long ApproximateMatchingCount
    {
        get;
        init;
    }

    public IReadOnlyList<WeeklyArchitectureCriticalFindingDto> SampleRows
    {
        get;
        init;
    } = [];
}
