using ArchLucid.Core.Configuration;

namespace ArchLucid.Core.QualityGates;

/// <summary>Builds config-derived gate definition snapshots at evaluate time (TB-972 / TB-973).</summary>
public static class QualityGateDefinitionSnapshotFactory
{
    public static QualityGateDefinitionSnapshot FromOptions(
        AgentOutputQualityGateOptions options,
        DateTimeOffset? effectiveFromUtc = null)
    {
        ArgumentNullException.ThrowIfNull(options);

        string contentHashSha256 = QualityGateDefinitionFingerprint.ComputeFromOptions(options);

        return new QualityGateDefinitionSnapshot
        {
            DefinitionVersion = $"config-{contentHashSha256[..12]}",
            ContentHashSha256 = contentHashSha256,
            Mode = options.Mode,
            EffectiveFromUtc = effectiveFromUtc ?? TimeProvider.System.GetUtcNow(),
        };
    }
}
