namespace ArchLucid.Contracts.Runs;

/// <summary>Token totals for a run (summed across agent execution traces).</summary>
public sealed class RunLlmTokenCountsDto
{
    public long Prompt
    {
        get;
        set;
    }

    public long Completion
    {
        get;
        set;
    }
}
