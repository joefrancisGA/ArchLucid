using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Optional Premium-tier pass that proposes package-novel findings from bounded evidence (DX-10).
/// </summary>
public interface IInsightFindingGenerator
{
    /// <summary>
    ///     Proposes new findings from typed-engine output and graph context. Gate application happens in
    ///     <see cref="FindingInsightDensityGateApplicator" /> during snapshot merge.
    /// </summary>
    Task<IReadOnlyList<Finding>> GenerateAsync(
        IReadOnlyList<Finding> engineFindings,
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken cancellationToken = default);
}
