using ArchLucid.Application.Determinism;
using ArchLucid.Application.Diagrams;
using ArchLucid.Application.Diffs;
using ArchLucid.Application.Summaries;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Builds an <see cref = "ArchitectureAnalysisReport"/> by orchestrating manifest, evidence, trace,
///     diagram, summary, determinism, and diff sub-services for a given run.
/// </summary>
public sealed class ArchitectureAnalysisService(
    IRunDetailQueryService runDetailQueryService,
    IScopeContextProvider scopeContextProvider,
    IUnifiedGoldenManifestReader unifiedGoldenManifestReader,
    IAgentEvidencePackageRepository evidenceRepository,
    IAgentExecutionTraceRepository traceRepository,
    IAgentResultRepository resultRepository,
    IDiagramGenerator diagramGenerator,
    IManifestSummaryGenerator summaryGenerator,
    IDeterminismCheckService determinismCheckService,
    IManifestDiffService manifestDiffService,
    IAgentResultDiffService agentResultDiffService,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService) : IArchitectureAnalysisService
{
    private const string ExecutionModeCurrent = ExecutionModes.Current;

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <inheritdoc/>
    public async Task<ArchitectureAnalysisReport> BuildAsync(ArchitectureAnalysisRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.RunId);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string primaryRunId = CanonicalRunIdForLookup(request.RunId);

        await ArchitectureAnalysisSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
            primaryRunId,
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);
        ArchitectureRunDetail? primaryDetail = request.PreloadedRunDetail;
        ArchitectureRun run;

        if (primaryDetail is not null)
        {
            if (!AnalysisRunIdCanonicalization.RunIdsReferToSameRun(primaryDetail.Run.RunId, request.RunId))
                throw new ArgumentException("PreloadedRunDetail.Run.RunId must match RunId.", nameof(request));

            run = primaryDetail.Run;
        }
        else if (request.PreloadedRun is not null)
            run = request.PreloadedRun;
        else
        {
            primaryDetail = await runDetailQueryService.GetRunDetailAsync(primaryRunId, cancellationToken) ?? throw new RunNotFoundException(request.RunId);
            run = primaryDetail.Run;
        }

        ArchitectureAnalysisReport report = new() { Run = run };

        if (request.IncludeEvidence)
        {
            report.Evidence = await TryLoadEvidencePackageAsync(primaryRunId, cancellationToken);

            if (report.Evidence is null)
                report.Warnings.Add("Evidence package was not found for this run.");
        }

        if (request.IncludeExecutionTraces)
        {
            report.ExecutionTraces = await TryLoadExecutionTracesAsync(scope, primaryRunId, cancellationToken);

            if (report.ExecutionTraces.Count == 0)
                report.Warnings.Add("No execution traces were found for this run.");
        }

        bool needsManifest = request.IncludeManifest
            || request.IncludeDiagram
            || request.IncludeSummary
            || request.IncludeManifestCompare;
        string manifestVersionKey = string.IsNullOrWhiteSpace(run.CurrentManifestVersion)
            ? $"v1-{run.RunId}"
            : run.CurrentManifestVersion.Trim();
        GoldenManifest? loadedManifest = null;

        if (needsManifest)
        {
            loadedManifest = primaryDetail?.Manifest;

            if (loadedManifest is not null && !AnalysisRunIdCanonicalization.RunIdsReferToSameRun(loadedManifest.RunId, run.RunId))
                loadedManifest = null;

            if (loadedManifest is null)
            {
                loadedManifest = await unifiedGoldenManifestReader.GetByVersionAsync(manifestVersionKey, cancellationToken);

                if (loadedManifest is not null && !AnalysisRunIdCanonicalization.RunIdsReferToSameRun(loadedManifest.RunId, run.RunId))
                    loadedManifest = null;
            }
        }

        if (request.IncludeManifest)
        {
            report.Manifest = loadedManifest;

            if (report.Manifest is null)
                report.Warnings.Add($"Manifest '{manifestVersionKey}' was not found.");
        }

        if (request.IncludeDiagram)
            if (loadedManifest is not null)
                report.Diagram = diagramGenerator.GenerateMermaid(loadedManifest);
            else
                report.Warnings.Add("Diagram was requested but the manifest is unavailable; diagram was not generated.");

        if (request.IncludeSummary)
            if (loadedManifest is not null)
                report.Summary = summaryGenerator.GenerateMarkdown(loadedManifest, report.Evidence);
            else
                report.Warnings.Add("Summary was requested but the manifest is unavailable; summary was not generated.");

        if (request.IncludeDeterminismCheck)
            if (request.DeterminismIterations < 2)
                report.Warnings.Add("Determinism check was requested but DeterminismIterations must be at least 2.");
            else
                report.Determinism = await determinismCheckService.RunAsync(
                    new DeterminismCheckRequest
                    {
                        RunId = primaryRunId,
                        Iterations = request.DeterminismIterations,
                        ExecutionMode = ExecutionModeCurrent,
                        CommitReplays = false,
                    },
                    cancellationToken);

        if (request.IncludeManifestCompare)
            if (string.IsNullOrWhiteSpace(request.CompareManifestVersion))
                report.Warnings.Add("Manifest comparison was requested but CompareManifestVersion was not provided.");
            else if (loadedManifest is null)
                report.Warnings.Add("Manifest comparison was requested but the primary manifest is not available.");
            else
            {
                string compareManifestVersion = request.CompareManifestVersion.Trim();
                GoldenManifest? compareManifest =
                    await unifiedGoldenManifestReader.GetByVersionAsync(compareManifestVersion, cancellationToken);

                if (compareManifest is null)
                    report.Warnings.Add($"Compare manifest '{compareManifestVersion}' was not found.");
                else if (!AnalysisRunIdCanonicalization.RunIdsReferToSameRun(compareManifest.RunId, loadedManifest.RunId))
                {
                    report.Warnings.Add(
                        $"Compare manifest '{compareManifestVersion}' does not belong to run '{loadedManifest.RunId}'.");
                }
                else
                    report.ManifestDiff = manifestDiffService.Compare(loadedManifest, compareManifest);
            }

        if (!request.IncludeAgentResultCompare)
            return report;

        if (string.IsNullOrWhiteSpace(request.CompareRunId))
            report.Warnings.Add("Agent-result comparison was requested but CompareRunId was not provided.");
        else
        {
            string compareRunId = CanonicalRunIdForLookup(request.CompareRunId);
            ArchitectureRunDetail? compareDetail = await runDetailQueryService.GetRunDetailAsync(compareRunId, cancellationToken);

            if (compareDetail is null)
                report.Warnings.Add($"Compare run '{request.CompareRunId}' was not found.");
            else
            {
                await ArchitectureAnalysisSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
                    compareRunId,
                    scope,
                    _authorityQueryService,
                    _manifestHashService,
                    cancellationToken);

                IReadOnlyList<AgentResult> leftResults =
                    await AnalysisRunIdCanonicalization.ResolveAgentResultsForCompareReadAsync(
                        resultRepository,
                        scope,
                        primaryDetail?.Results ?? [],
                        primaryRunId,
                        useRollupProjection: true,
                        cancellationToken).ConfigureAwait(false);
                IReadOnlyList<AgentResult> rightResults =
                    await AnalysisRunIdCanonicalization.ResolveAgentResultsForCompareReadAsync(
                        resultRepository,
                        scope,
                        compareDetail.Results,
                        compareRunId,
                        useRollupProjection: true,
                        cancellationToken).ConfigureAwait(false);
                report.AgentResultDiff = agentResultDiffService.Compare(primaryRunId, leftResults, compareRunId, rightResults);
            }
        }

        return report;
    }

    /// <summary>
    ///     Route parameters may use dashed GUIDs while persisted run rows use canonical N-format ids.
    /// </summary>
    private Task<AgentEvidencePackage?> TryLoadEvidencePackageAsync(
        string primaryRunId,
        CancellationToken cancellationToken) =>
        AnalysisRunIdCanonicalization.LoadEvidencePackageByRunIdAsync(
            evidenceRepository,
            primaryRunId,
            cancellationToken);

    private async Task<List<AgentExecutionTrace>> TryLoadExecutionTracesAsync(
        ScopeContext scope,
        string primaryRunId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<AgentExecutionTrace> traces = await AnalysisRunIdCanonicalization
            .LoadExecutionTracesByRunIdAsync(traceRepository, scope, primaryRunId, cancellationToken)
            .ConfigureAwait(false);

        return traces.ToList();
    }

    private static string CanonicalRunIdForLookup(string runId) =>
        AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId);
}
