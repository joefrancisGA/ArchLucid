using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Trust;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Trust;

public sealed partial class RunTrustEvidenceCardBuilder
{
    private static TrustEvidenceFieldSnapshot BuildExecutionModeField(ArchitectureRun run, bool isDemo)
    {
        ArgumentNullException.ThrowIfNull(run);

        if (isDemo)
            return new TrustEvidenceFieldSnapshot
            {
                Title = "Execution mode",
                Status = TrustEvidenceStatusValue.DemoOnly,
                Detail = BuildBuyerExecutionSummary(run),
            };

        StructuralExecutionMode mode = run.StructuralExecutionMode;

        if (mode == StructuralExecutionMode.Fallback || run.RealModeFellBackToSimulator)
            return new TrustEvidenceFieldSnapshot
            {
                Title = "Execution mode",
                Status = TrustEvidenceStatusValue.LowConfidence,
                Detail = StructuralExecutionModeLabels.ToOperatorDetail(StructuralExecutionMode.Fallback),
            };

        if (mode == StructuralExecutionMode.Mixed)
            return new TrustEvidenceFieldSnapshot
            {
                Title = "Execution mode",
                Status = TrustEvidenceStatusValue.LowConfidence,
                Detail = StructuralExecutionModeLabels.MixedDetail,
            };

        return new TrustEvidenceFieldSnapshot
        {
            Title = "Execution mode",
            Status = TrustEvidenceStatusValue.Available,
            Detail = StructuralExecutionModeLabels.ToOperatorDetail(mode),
        };
    }

    private async Task<(TrustEvidenceFieldSnapshot Audit, TrustEvidenceFieldSnapshot Traces)> BuildAuditAndTraceFieldsAsync(string runId, Guid? runGuid,
        CancellationToken cancellationToken)
    {
        TrustEvidenceFieldSnapshot audit;

        if (runGuid is null)
            audit = new TrustEvidenceFieldSnapshot
            {
                Title = "Audit events (run-scoped)",
                Status = TrustEvidenceStatusValue.Missing,
                Detail = "Run id is not a GUID; durable audit correlation is unavailable.",
            };
        else
            try
            {
                ScopeContext scope = _scopeContextProvider.GetCurrentScope();
                AuditEventFilter filter = new()
                {
                    RunId = runGuid,
                    Take = 1
                };
                int count = await _auditRepository.CountFilteredAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, filter, cancellationToken)
                    .ConfigureAwait(false);
                audit = new TrustEvidenceFieldSnapshot
                {
                    Title = "Audit events (run-scoped)",
                    Status = TrustEvidenceStatusValue.Available,
                    Detail = FormattableString.Invariant($"{count} events"),
                };
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                audit = new TrustEvidenceFieldSnapshot
                {
                    Title = "Audit events (run-scoped)",
                    Status = TrustEvidenceStatusValue.LowConfidence,
                    Detail = "Audit count could not be loaded for this scope.",
                };
            }

        TrustEvidenceFieldSnapshot traces;

        try
        {
            ScopeContext traceScope = _scopeContextProvider.GetCurrentScope();
            int total = await _agentExecutionTraceRepository.CountByRunIdAsync(traceScope, runId, cancellationToken).ConfigureAwait(false);
            traces = new TrustEvidenceFieldSnapshot
            {
                Title = "Agent execution trace rows",
                Status = TrustEvidenceStatusValue.Available,
                Detail = FormattableString.Invariant($"{total} rows (prompt/response metadata; not raw transcripts in this view)."),
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            traces = new TrustEvidenceFieldSnapshot
            {
                Title = "Agent execution trace rows",
                Status = TrustEvidenceStatusValue.Missing,
                Detail = "Trace repository did not return totals for this run.",
            };
        }

        return (audit, traces);
    }

    private async Task<RunExplanationSummary?> TryExplanationAsync(Guid runGuid, CancellationToken cancellationToken)
    {
        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            return await _runExplanationSummaryService.GetSummaryAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return null;
        }
    }

    private static TrustEvidenceFieldSnapshot BuildAiField(RunExplanationSummary? explanation)
    {
        if (explanation is null)
            return new TrustEvidenceFieldSnapshot
            {
                Title = "AI explainability rollup",
                Status = TrustEvidenceStatusValue.LowConfidence,
                Detail = "Faithfulness / trace completeness rollup was not available.",
            };

        if (explanation.DeterministicFallbackUsed)
            return new TrustEvidenceFieldSnapshot
            {
                Title = "AI explainability rollup",
                Status = TrustEvidenceStatusValue.LowConfidence,
                Detail = "Deterministic narrative fallback was used for weak faithfulness.",
            };

        if (!string.IsNullOrWhiteSpace(explanation.FaithfulnessWarning))
            return new TrustEvidenceFieldSnapshot
            {
                Title = "AI explainability rollup",
                Status = TrustEvidenceStatusValue.LowConfidence,
                Detail = explanation.FaithfulnessWarning.Trim(),
            };

        FindingTraceConfidenceDto? first = explanation.FindingTraceConfidences?.FirstOrDefault();

        if (first is not null && string.Equals(first.TraceConfidenceLabel, "Low", StringComparison.OrdinalIgnoreCase))
            return new TrustEvidenceFieldSnapshot
            {
                Title = "AI explainability rollup",
                Status = TrustEvidenceStatusValue.LowConfidence,
                Detail = FormattableString.Invariant($"Low trace completeness on finding {first.FindingId} (ratio {first.TraceCompletenessRatio:0.##})."),
            };

        double? ratio = explanation.FaithfulnessSupportRatio;
        return new TrustEvidenceFieldSnapshot
        {
            Title = "AI explainability rollup",
            Status = TrustEvidenceStatusValue.Available,
            Detail = ratio is { } r
                ? FormattableString.Invariant($"Faithfulness support ratio {r:0.##}; per-finding trace completeness in explainability views.")
                : "No faithfulness ratio for this rollup (findings may be empty).",
        };
    }

    private async Task<FindingEvidenceChainResponse?> TryChainAsync(string runId, string findingId, CancellationToken cancellationToken)
    {
        try
        {
            return await _findingEvidenceChainService.BuildAsync(runId, findingId, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return null;
        }
    }
}
