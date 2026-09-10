namespace ArchLucid.Contracts.Findings;

/// <summary>Request body for clearing a finding mute on one authority run.</summary>
public sealed class FindingUnmuteRequest
{
    public Guid RunId
    {
        get;
        init;
    }
}
