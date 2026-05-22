namespace ArchLucid.Application.Runs.Sample;

/// <summary>Aggregate outcome of a sample-run purge pass.</summary>
public sealed class SampleRunPurgeResult
{
    public int RunsDeleted
    {
        get;
        init;
    }
}
