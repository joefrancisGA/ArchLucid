namespace ArchLucid.Contracts.Agents;

/// <summary>Buyer-safe gate definition identity captured at evaluate time (TB-973).</summary>
public sealed class QualityGateDefinitionSnapshotDto
{
    public required string DefinitionVersion
    {
        get;
        init;
    }

    public required string ContentHashSha256
    {
        get;
        init;
    }

    /// <summary><c>WarnOnly</c> or <c>PilotStrict</c>.</summary>
    public required string Mode
    {
        get;
        init;
    }

    public required DateTimeOffset EffectiveFromUtc
    {
        get;
        init;
    }

    public string? DeprecatedReason
    {
        get;
        init;
    }
}
