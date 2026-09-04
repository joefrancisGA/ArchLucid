using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Explanation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Trust;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Trust;

/// <inheritdoc cref = "IRunTrustEvidenceCardBuilder"/>
public sealed partial class RunTrustEvidenceCardBuilder(
    IAuditRepository auditRepository,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IFindingEvidenceChainService findingEvidenceChainService,
    IRunExplanationSummaryService runExplanationSummaryService,
    IScopeContextProvider scopeContextProvider,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService) : IRunTrustEvidenceCardBuilder
{
    private const string SelfNotice = "This card summarizes operational evidence ArchLucid stores for this review (audit events, trace metadata, " + "exports). It is not a SOC 2 report, independent penetration test, or legal attestation—see your trust center " + "for assurance boundaries.";

    private readonly IAuditRepository _auditRepository = auditRepository ?? throw new ArgumentNullException(nameof(auditRepository));

    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly IFindingEvidenceChainService _findingEvidenceChainService =
        findingEvidenceChainService ?? throw new ArgumentNullException(nameof(findingEvidenceChainService));

    private readonly IRunExplanationSummaryService _runExplanationSummaryService =
        runExplanationSummaryService ?? throw new ArgumentNullException(nameof(runExplanationSummaryService));

    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    /// <inheritdoc/>
    public async Task<RunTrustEvidenceCard?> BuildAsync(ArchitectureRunDetail detail, string? hostAgentExecutionMode, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(detail);

        if (!detail.IsCommitted)
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await RunTrustEvidenceSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
            detail,
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        ArchitectureRun run = detail.Run;
        string runId = run.RunId;
        bool isDemo = ContosoRetailDemoIdentifiers.IsDemoRunId(runId) || ContosoRetailDemoIdentifiers.IsDemoRequestId(run.RequestId);
        Guid? runGuid = TryParseRunGuid(runId, out Guid rg) ? rg : null;
        TrustEvidenceFieldSnapshot execution = BuildExecutionModeField(run, isDemo);
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
}
