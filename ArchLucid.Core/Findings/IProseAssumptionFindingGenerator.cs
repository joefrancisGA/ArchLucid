using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Optional Real-mode pass that extracts prose assumptions and emits contradiction findings (DX-55).
/// </summary>
public interface IProseAssumptionFindingGenerator
{
    Task<IReadOnlyList<Finding>> GenerateAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken cancellationToken = default);
}
