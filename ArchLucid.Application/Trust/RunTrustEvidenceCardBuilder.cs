using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Explanation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Trust;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Trust;

/// <inheritdoc cref = "IRunTrustEvidenceCardBuilder"/>
public sealed class RunTrustEvidenceCardBuilder(
    IAuditRepository auditRepository,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IFindingEvidenceChainService findingEvidenceChainService,
    IRunExplanationSummaryService runExplanationSummaryService,
    IScopeContextProvider scopeContextProvider) : IRunTrustEvidenceCardBuilder
{
    private static readonly string SelfNotice = "This card summarizes operational evidence ArchLucid stores for this review (audit events, trace metadata, " +
                                                "exports). It is not a SOC 2 report, independent penetration test, or legal attestation—see your trust center " +
                                                "for assurance boundaries.";

    private readonly IAuditRepository _auditRepository = auditRepository ?? throw new ArgumentNullException(nameof(auditRepository));

    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly IFindingEvidenceChainService _findingEvidenceChainService =
        findingEvidenceChainService ?? throw new ArgumentNullException(nameof(findingEvidenceChainService));

    private readonly IRunExplanationSummaryService _runExplanationSummaryService =
        runExplanationSummaryService ?? throw new ArgumentNullException(nameof(runExplanationSummaryService));

    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    /// <inheritdoc/>
    public async Task<RunTrustEvidenceCard?> BuildAsync(ArchitectureRunDetail detail, string? hostAgentExecutionMode, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(detail);
        if (!detail.IsCommitted)
            return null;
        ArchitectureRun run = detail.Run;
        string runId = run.RunId;
        bool isDemo = ContosoRetailDemoIdentifiers.IsDemoRunId(runId) || ContosoRetailDemoIdentifiers.IsDemoRequestId(run.RequestId);
        Guid? runGuid = TryParseRunGuid(runId, out Guid rg) ? rg : null;
        TrustEvidenceFieldSnapshot execution = BuildExecutionModeField(run, hostAgentExecutionMode, isDemo);
        TrustEvidenceFieldSnapshot manifestField = new()
        {
            Title = "Golden manifest snapshot",
            Status = run.GoldenManifestId is { } gmId && gmId != Guid.Empty ? TrustEvidenceStatusValue.Available : TrustEvidenceStatusValue.Missing,
            Detail = detail.Manifest is { } m
                ? FormattableString.Invariant($"Version {m.Metadata.ManifestVersion}; committed {m.Metadata.CreatedUtc:O}")
                : null,
        };
        (TrustEvidenceFieldSnapshot auditField, TrustEvidenceFieldSnapshot traceField) =
            await BuildAuditAndTraceFieldsAsync(runId, runGuid, cancellationToken).ConfigureAwait(false);
        TrustEvidenceFieldSnapshot bundlePointer = new()
        {
            Title = "Persisted artifact bundle id",
            Status = run.ArtifactBundleId is { } b && b != Guid.Empty ? TrustEvidenceStatusValue.Available : TrustEvidenceStatusValue.Missing,
            Detail = run.ArtifactBundleId is { } id && id != Guid.Empty
                ? FormattableString.Invariant($"Bundle id {id:D}")
                : "No artifact bundle pointer on the run record.",
        };
        TrustEvidenceFieldSnapshot zipField = new()
        {
            Title = "Review-trail export (ZIP)",
            Status = TrustEvidenceStatusValue.Available,
            Detail = "Self-service export (audit slice + decision traces + summary); responses are size-capped on the API.",
        };
        RunExplanationSummary? explanation = runGuid is { } ? await TryExplanationAsync(runGuid.Value, cancellationToken).ConfigureAwait(false) : null;
        TrustEvidenceFieldSnapshot ai = BuildAiField(explanation);
        ArchitectureFinding? topFinding = SelectTopSeverityFinding(detail);
        RunTrustEvidenceTopFindingRow? topRow = null;
        if (topFinding is not null)
        {
            FindingEvidenceChainResponse? chain = await TryChainAsync(runId, topFinding.FindingId, cancellationToken).ConfigureAwait(false);
            FindingTraceConfidenceDto? match = explanation?.FindingTraceConfidences?.FirstOrDefault(f => f.FindingId == topFinding.FindingId);
            topRow = new RunTrustEvidenceTopFindingRow
            {
                FindingId = topFinding.FindingId,
                Title = TruncateTitle(topFinding.Message),
                TraceCompletenessLabel = match?.TraceConfidenceLabel ?? "Not available",
                EvidencePointersSummary = SummarizeChain(chain),
            };
        }

        List<RunTrustEvidenceRouteRef> links = BuildLinks(runId, topFinding?.FindingId);
        return new RunTrustEvidenceCard
        {
            SelfAttestationNotice = SelfNotice,
            ExecutionMode = execution,
            GoldenManifest = manifestField,
            AuditTrail = auditField,
            AgentTraces = traceField,
            ArtifactBundlePointer = bundlePointer,
            TraceabilityExport = zipField,
            AiExplainability = ai,
            TopFinding = topRow,
            Links = links,
        };
    }

    private static List<RunTrustEvidenceRouteRef> BuildLinks(string runId, string? topFindingId)
    {
        string enc = Uri.EscapeDataString(runId);
        List<RunTrustEvidenceRouteRef> links =
        [
            new()
            {
                Rel = "traceabilityZip",
                Path = FormattableString.Invariant($"/v1/architecture/run/{enc}/traceability-bundle.zip"),
                Label = "Review-trail ZIP",
            },
            new()
            {
                Rel = "traces", Path = FormattableString.Invariant($"/v1/architecture/run/{enc}/traces"), Label = "Agent execution traces",
            },
            new()
            {
                Rel = "evidence", Path = FormattableString.Invariant($"/v1/architecture/run/{enc}/evidence"), Label = "Evidence package",
            },
        ];
        if (!string.IsNullOrWhiteSpace(topFindingId))
        {
            links.Add(new RunTrustEvidenceRouteRef
            {
                Rel = "topFindingEvidenceChain",
                Path = FormattableString.Invariant($"/v1/architecture/run/{enc}/findings/{Uri.EscapeDataString(topFindingId)}/evidence-chain"),
                Label = "Top finding evidence chain",
            });
        }

        return links;
    }

    private TrustEvidenceFieldSnapshot BuildExecutionModeField(ArchitectureRun run, string? hostAgentExecutionMode, bool isDemo)
    {
        if (isDemo)
        {
            return new TrustEvidenceFieldSnapshot
            {
                Title = "Execution mode",
                Status = TrustEvidenceStatusValue.DemoOnly,
                Detail = BuildBuyerExecutionSummary(run, hostAgentExecutionMode),
            };
        }

        if (run.RealModeFellBackToSimulator)
        {
            return new TrustEvidenceFieldSnapshot
            {
                Title = "Execution mode",
                Status = TrustEvidenceStatusValue.LowConfidence,
                Detail = BuildBuyerExecutionSummary(run, hostAgentExecutionMode),
            };
        }

        string mode = string.IsNullOrWhiteSpace(hostAgentExecutionMode) ? "Simulator" : hostAgentExecutionMode.Trim();
        bool simulator = !string.Equals(mode, "Real", StringComparison.OrdinalIgnoreCase);
        return new TrustEvidenceFieldSnapshot
        {
            Title = "Execution mode",
            Status = TrustEvidenceStatusValue.Available,
            Detail = simulator
                ? "Simulator / deterministic agent path (no live model for agent work on this host configuration)."
                : "Live model path for agent work (subject to current host execution settings).",
        };
    }

    private async Task<(TrustEvidenceFieldSnapshot Audit, TrustEvidenceFieldSnapshot Traces)> BuildAuditAndTraceFieldsAsync(string runId, Guid? runGuid,
        CancellationToken cancellationToken)
    {
        TrustEvidenceFieldSnapshot audit;
        
        if (runGuid is null)
        {
            audit = new TrustEvidenceFieldSnapshot
            {
                Title = "Audit events (run-scoped)",
                Status = TrustEvidenceStatusValue.Missing,
                Detail = "Run id is not a GUID; durable audit correlation is unavailable.",
            };
        }
        else
        {
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
        }

        TrustEvidenceFieldSnapshot traces;
        
        try
        {
            (_, int total) = await _agentExecutionTraceRepository.GetPagedByRunIdAsync(runId, 0, 1, cancellationToken).ConfigureAwait(false);
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
        {
            return new TrustEvidenceFieldSnapshot
            {
                Title = "AI explainability rollup",
                Status = TrustEvidenceStatusValue.LowConfidence,
                Detail = "Faithfulness / trace completeness rollup was not available.",
            };
        }

        if (explanation.DeterministicFallbackUsed)
        {
            return new TrustEvidenceFieldSnapshot
            {
                Title = "AI explainability rollup",
                Status = TrustEvidenceStatusValue.LowConfidence,
                Detail = "Deterministic narrative fallback was used for weak faithfulness.",
            };
        }

        if (!string.IsNullOrWhiteSpace(explanation.FaithfulnessWarning))
        {
            return new TrustEvidenceFieldSnapshot
            {
                Title = "AI explainability rollup",
                Status = TrustEvidenceStatusValue.LowConfidence,
                Detail = explanation.FaithfulnessWarning.Trim(),
            };
        }

        FindingTraceConfidenceDto? first = explanation.FindingTraceConfidences?.FirstOrDefault();
        if (first is not null && string.Equals(first.TraceConfidenceLabel, "Low", StringComparison.OrdinalIgnoreCase))
        {
            return new TrustEvidenceFieldSnapshot
            {
                Title = "AI explainability rollup",
                Status = TrustEvidenceStatusValue.LowConfidence,
                Detail = FormattableString.Invariant($"Low trace completeness on finding {first.FindingId} (ratio {first.TraceCompletenessRatio:0.##})."),
            };
        }

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

    private static string SummarizeChain(FindingEvidenceChainResponse? chain)
    {
        if (chain is null)
            return "Evidence chain pointers not available.";
        int nodes = chain.RelatedGraphNodeIds.Count;
        int traces = chain.AgentExecutionTraceIds.Count;
        return FormattableString.Invariant($"Manifest version {chain.ManifestVersion ?? "—"}; graph nodes: {nodes}; linked trace ids: {traces}.");
    }

    private static ArchitectureFinding? SelectTopSeverityFinding(ArchitectureRunDetail detail)
    {
        return detail.Results.Where(_ => true).SelectMany(static r => r.Findings).Where(_ => true).OrderByDescending(static f => (int)f.Severity)
            .FirstOrDefault();
    }

    private static string? TruncateTitle(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return null;
        string t = message.Trim();
        return t.Length <= 160 ? t : string.Concat(t.AsSpan(0, 157), "...");
    }

    /// <summary>Matches sponsor copy in <c>ArchLucid.Api.Support.RunExecutionFlavorSummary</c> without referencing the API layer.</summary>
    private static string BuildBuyerExecutionSummary(ArchitectureRun run, string? hostAgentExecutionMode)
    {
        ArgumentNullException.ThrowIfNull(run);
        string mode = string.IsNullOrWhiteSpace(hostAgentExecutionMode) ? "Simulator" : hostAgentExecutionMode.Trim();
        if (run.RealModeFellBackToSimulator)
        {
            return
                "Part of this architecture review used deterministic output after a live-model path failed. Treat numeric highlights cautiously; open the first-value report for the full execution provenance table.";
        }

        return string.Equals(mode, "Real", StringComparison.OrdinalIgnoreCase)
            ? "Agent steps for this review used the live model path, subject to this API host's execution configuration when you loaded this page."
            : "Agent steps for this review used deterministic simulator execution (no live LLM calls for agent work).";
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}
