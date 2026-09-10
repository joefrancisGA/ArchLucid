using ArchLucid.Application.Findings.PortfolioRecurrence;
using ArchLucid.Application.Findings.PortfolioSharedTopology;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Reports when this run and another committed system share a product-shaped inventory resource id
///     but declare incompatible security or DR posture.
/// </summary>
public sealed class PortfolioSharedTopologyFindingEngine(
    IScopeContextProvider scopeContextProvider,
    IPortfolioSharedTopologyFindingOptionsResolver optionsResolver,
    IPortfolioRunScanSource runScanSource,
    ISharedTopologyMatcher sharedTopologyMatcher,
    IPortfolioSharedTopologyFindingEmitter findingEmitter) : IEffectfulFindingEngine
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IPortfolioSharedTopologyFindingOptionsResolver _optionsResolver =
        optionsResolver ?? throw new ArgumentNullException(nameof(optionsResolver));

    private readonly IPortfolioRunScanSource _runScanSource =
        runScanSource ?? throw new ArgumentNullException(nameof(runScanSource));

    private readonly ISharedTopologyMatcher _sharedTopologyMatcher =
        sharedTopologyMatcher ?? throw new ArgumentNullException(nameof(sharedTopologyMatcher));

    private readonly IPortfolioSharedTopologyFindingEmitter _findingEmitter =
        findingEmitter ?? throw new ArgumentNullException(nameof(findingEmitter));

    public string EngineType => "portfolio-shared-topology";

    public string Category => "Topology";

    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        PortfolioSharedTopologyFindingOptions options = _optionsResolver.Resolve(ct);

        if (!options.Enabled)
        {
            return [];
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        IReadOnlyList<KeyValuePair<string, RunSummary>> scannedSystems =
            await _runScanSource.CollectLatestCommittedSystemsAsync(options.MaxSystemsScanned, ct)
                .ConfigureAwait(false);

        if (scannedSystems.Count == 0)
        {
            return [];
        }

        IReadOnlyList<SharedTopologyConflict> conflicts = await _sharedTopologyMatcher
            .MatchAsync(scope, graphSnapshot, scannedSystems, ct)
            .ConfigureAwait(false);

        if (conflicts.Count == 0)
        {
            return [];
        }

        return _findingEmitter.EmitFindings(conflicts, options);
    }
}
