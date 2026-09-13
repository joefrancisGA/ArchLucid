using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Runs the Premium semantic-support judge on Unchecked decision-grade rows at finalize/readiness (ADR 0099).
///     Fail-open: judge errors leave the heuristic band in place and never block seal by themselves.
/// </summary>
public sealed class FindingSemanticSupportBandFinalizeJudge(
    IFindingSemanticSupportBandLlmJudge llmJudge,
    IOptions<FindingSemanticSupportBandOptions> options,
    FindingSemanticSupportBandOverlayWriter overlayWriter) : IFindingSemanticSupportBandFinalizeJudge
{
    private readonly IFindingSemanticSupportBandLlmJudge _llmJudge =
        llmJudge ?? throw new ArgumentNullException(nameof(llmJudge));

    private readonly IOptions<FindingSemanticSupportBandOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly FindingSemanticSupportBandOverlayWriter _overlayWriter =
        overlayWriter ?? throw new ArgumentNullException(nameof(overlayWriter));

    public async Task ApplyAsync(
        ArchitectureRun run,
        FindingsSnapshot snapshot,
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(scope);

        FindingSemanticSupportBandOptions options = _options.Value;

        if (!FindingSemanticSupportBandFinalizeJudgePolicy.ShouldRun(run.StructuralExecutionMode, options))
            return;

        if (snapshot.Findings.Count == 0)
            return;

        List<Finding> rescored = [];

        foreach (Finding finding in snapshot.Findings)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (!ShouldJudgeFinding(finding))
                continue;

            string findingMessage = FindingSemanticSupportBandClaimMessageResolver.Resolve(finding);
            IReadOnlyList<string> citationExcerpts = finding.EvidenceRefs
                .Where(static reference => !string.IsNullOrWhiteSpace(reference))
                .Select(static reference => reference.Trim())
                .ToList();

            if (citationExcerpts.Count == 0)
                continue;

            FindingSemanticSupportBand? llmBand = await _llmJudge.TryScoreAsync(
                    finding,
                    findingMessage,
                    citationExcerpts,
                    options,
                    cancellationToken)
                .ConfigureAwait(false);

            if (llmBand is null)
                continue;

            finding.SemanticSupportBand = llmBand.Value;
            rescored.Add(finding);
        }

        if (rescored.Count == 0 || snapshot.FindingsSnapshotId == Guid.Empty)
            return;

        await _overlayWriter.PersistAssignedOverlaysAsync(
                snapshot.FindingsSnapshotId,
                scope,
                rescored,
                FindingSemanticSupportBandScorerVersions.As099LlmFinalizeV1,
                cancellationToken)
            .ConfigureAwait(false);
    }

    private static bool ShouldJudgeFinding(Finding finding)
    {
        if (!DecisionGradeFindingExportFilter.IsDecisionGradeForExport(finding))
            return false;

        return finding.SemanticSupportBand is null
            || finding.SemanticSupportBand == FindingSemanticSupportBand.Unchecked;
    }
}
