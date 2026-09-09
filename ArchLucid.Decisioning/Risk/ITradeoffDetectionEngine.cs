using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Risk;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Decisioning.Risk;

public interface ITradeoffDetectionEngine
{
    Task<IReadOnlyList<ArchitectureTradeoff>> DetectAsync(
        ManifestDocument manifest,
        TransparencyTrail trail,
        IReadOnlyList<string> statedRequirements,
        string? businessOutcome,
        CancellationToken cancellationToken = default);
}
