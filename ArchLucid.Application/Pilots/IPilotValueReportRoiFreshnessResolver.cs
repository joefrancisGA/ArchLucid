using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Resolves sponsor-handoff ROI freshness disposition for tenant pilot value reports (wave-43 suggestion 509).
/// </summary>
public interface IPilotValueReportRoiFreshnessResolver
{
    Task<string> ResolveForRunDetailAsync(ArchitectureRunDetail? detail, CancellationToken cancellationToken);
}
