using ArchLucid.Application.Findings.PortfolioRecurrence;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Reports when a finding identity in the current review recurs across other systems in the tenant portfolio.
/// </summary>
public sealed class PortfolioRecurrenceFindingEngine(
    IScopeContextProvider scopeContextProvider,
    IPortfolioRecurrenceFindingOptionsResolver optionsResolver,
    IPortfolioRunScanSource runScanSource,
    IRecurrenceIdentityMatcher identityMatcher,
    IPortfolioRecurrenceFindingEmitter findingEmitter) : IEffectfulFindingEngine
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IPortfolioRecurrenceFindingOptionsResolver _optionsResolver =
        optionsResolver ?? throw new ArgumentNullException(nameof(optionsResolver));

    private readonly IPortfolioRunScanSource _runScanSource =
        runScanSource ?? throw new ArgumentNullException(nameof(runScanSource));

    private readonly IRecurrenceIdentityMatcher _identityMatcher =
        identityMatcher ?? throw new ArgumentNullException(nameof(identityMatcher));

    private readonly IPortfolioRecurrenceFindingEmitter _findingEmitter =
        findingEmitter ?? throw new ArgumentNullException(nameof(findingEmitter));

    public string EngineType => "portfolio-recurrence";

    public string Category => "Topology";

    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        PortfolioRecurrenceFindingOptions options = _optionsResolver.Resolve(ct);

        if (!options.Enabled)
            return [];

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        IReadOnlyList<KeyValuePair<string, RunSummary>> scannedSystems =
            await _runScanSource.CollectLatestCommittedSystemsAsync(options.MaxSystemsScanned, ct)
                .ConfigureAwait(false);

        if (scannedSystems.Count == 0)
            return [];

        RecurrenceMatchResult matchResult = await _identityMatcher
            .MatchAsync(scope, graphSnapshot, scannedSystems, ct)
            .ConfigureAwait(false);

        HashSet<string> currentScopeIdentities = _identityMatcher.ResolveCurrentScopeIdentities(
            graphSnapshot,
            scannedSystems,
            matchResult.IdentitiesBySystem);

        if (currentScopeIdentities.Count == 0)
            return [];

        return _findingEmitter.EmitQualifyingFindings(matchResult, currentScopeIdentities, options);
    }
}
