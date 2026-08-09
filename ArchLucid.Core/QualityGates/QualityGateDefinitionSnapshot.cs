using ArchLucid.Core.Configuration;

namespace ArchLucid.Core.QualityGates;

/// <summary>
///     Append-only quality-gate definition identity captured at evaluate time (TB-972 contract; TB-973 persistence).
/// </summary>
public sealed class QualityGateDefinitionSnapshot
{
    /// <summary>Monotonic operator label (semver, date stamp, or deployment id).</summary>
    public required string DefinitionVersion
    {
        get;
        init;
    }

    /// <summary>Lowercase hex SHA-256 from <see cref="QualityGateDefinitionFingerprint.ComputeFromOptions" />.</summary>
    public required string ContentHashSha256
    {
        get;
        init;
    }

    public required AgentOutputQualityGateMode Mode
    {
        get;
        init;
    }

    public required DateTimeOffset EffectiveFromUtc
    {
        get;
        init;
    }

    /// <summary>When superseded, human-readable reason; null while active.</summary>
    public string? DeprecatedReason
    {
        get;
        init;
    }
}
