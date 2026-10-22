using ArchLucid.Core.Findings;

namespace ArchLucid.Application.Findings.PortfolioSharedTopology;

/// <summary>One shared-resource posture disagreement between this run and a peer system (DX-53).</summary>
public sealed class SharedTopologyConflict
{
    public required SharedResourcePostureEntry CurrentEntry
    {
        get;
        init;
    }

    public required string OtherSystemId
    {
        get;
        init;
    }

    public required string OtherRunId
    {
        get;
        init;
    }

    public required string OtherPostureCode
    {
        get;
        init;
    }
}
