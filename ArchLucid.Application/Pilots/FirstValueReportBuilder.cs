using System.Text;

using ArchLucid.Application.InfraEvidence.Branding;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Roi;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Value;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Contracts.Roi;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Queries;
using ArchLucid.Core.InfraEvidence;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Builds a sponsor-facing Markdown summary for a single architecture run (read-only projection).
/// </summary>
/// <remarks>
///     Computed deltas (wall-clock, findings-by-severity, audit rows, LLM calls, top-severity evidence chain) are
///     resolved by <see cref = "IPilotRunDeltaComputer"/> so this builder and <see cref = "SponsorOnePagerPdfBuilder"/>
///     stay in lockstep — the same numbers appear in the Markdown sibling and in the sponsor PDF wrapper.
///     A sponsor-safe proof-status block (<see cref = "SponsorSafeProofStatusMarkdownFormatter"/>) is emitted immediately after
///     the prose preface — it reuses <see cref = "PilotBuyerSafeEvidenceGateEvaluator"/> and <see cref = "PilotProofPackageCompletenessMapper"/> only.
///     The review-cycle delta section uses the same <see cref = "ValueReportSnapshot"/> as the tenant value-report DOCX
///     (default 30-day UTC window ending now; see <c>ValueReportController</c>).
/// </remarks>
public sealed class FirstValueReportBuilder(
    IRunDetailQueryService runDetailQuery,
    IPilotRunDeltaComputer deltaComputer,
    ValueReportBuilder valueReportBuilder,
    IScopeContextProvider scopeProvider,
    IExecutionProvenanceFooterRenderer executionProvenanceFooter,
    IConfiguration configuration,
    IOptionsMonitor<PublicSiteOptions> publicSiteOptions,
    ITenantReportBrandingApplyHelper reportBrandingApplyHelper,
    IPilotBaselineRepository pilotBaselineRepository,
    RoiCostEvidenceCollectionResolver roiCostEvidenceCollectionResolver,
    IOptions<RoiCostEvidenceFreshnessOptions> roiCostEvidenceFreshnessOptions,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    IGraphSnapshotRepository graphSnapshotRepository,
    ILogger<FirstValueReportBuilder> logger) : IFirstValueReportBuilder
{
    private readonly IOptionsMonitor<PublicSiteOptions> _publicSiteOptions = publicSiteOptions ?? throw new ArgumentNullException(nameof(publicSiteOptions));

    private readonly IConfiguration _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
    private readonly IPilotRunDeltaComputer _deltaComputer = deltaComputer ?? throw new ArgumentNullException(nameof(deltaComputer));

    private readonly IExecutionProvenanceFooterRenderer _executionProvenanceFooter =
        executionProvenanceFooter ?? throw new ArgumentNullException(nameof(executionProvenanceFooter));

    private readonly ITenantReportBrandingApplyHelper _reportBrandingApplyHelper =
        reportBrandingApplyHelper ?? throw new ArgumentNullException(nameof(reportBrandingApplyHelper));

    private readonly IPilotBaselineRepository _pilotBaselineRepository =
        pilotBaselineRepository ?? throw new ArgumentNullException(nameof(pilotBaselineRepository));

    private readonly RoiCostEvidenceCollectionResolver _roiCostEvidenceCollectionResolver =
        roiCostEvidenceCollectionResolver ?? throw new ArgumentNullException(nameof(roiCostEvidenceCollectionResolver));

    private readonly RoiCostEvidenceFreshnessOptions _roiCostEvidenceFreshnessOptions =
        roiCostEvidenceFreshnessOptions?.Value ?? throw new ArgumentNullException(nameof(roiCostEvidenceFreshnessOptions));

    private readonly ILogger<FirstValueReportBuilder> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IRunDetailQueryService _runDetailQuery = runDetailQuery ?? throw new ArgumentNullException(nameof(runDetailQuery));
    private readonly IScopeContextProvider _scopeProvider = scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));
    private readonly ValueReportBuilder _valueReportBuilder = valueReportBuilder ?? throw new ArgumentNullException(nameof(valueReportBuilder));
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));
    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));
    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    /// <summary>
    ///     Returns Markdown, or <see langword="null"/> when the run does not exist.
    ///     When the run exists but is not committed, returns Markdown that states the gap explicitly.
    /// </summary>
    public async Task<String?> BuildMarkdownAsync(string runId, string apiBaseForLinks, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(apiBaseForLinks);
        FirstValueReportBuildResult? built = await BuildReportAsync(runId, apiBaseForLinks, cancellationToken);
        return built?.Markdown;
    }

    /// <summary>
    ///     Returns Markdown plus evidence classification for PDF watermarks, or <see langword="null"/> when the run does not exist.
    /// </summary>
    public async Task<FirstValueReportBuildResult?> BuildReportAsync(string runId, string apiBaseForLinks, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(apiBaseForLinks);
        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("Run id is required.", nameof(runId));
        string baseUrl = string.IsNullOrWhiteSpace(apiBaseForLinks) ? "http://localhost:5000" : apiBaseForLinks.Trim().TrimEnd('/');
        ArchitectureRunDetail? detail = await _runDetailQuery.GetRunDetailAsync(runId, cancellationToken);
        if (detail is null)
        {
            _logger.LogInformationFirstValueReportRunNotFound(runId);
            return null;
        }

        if (detail.IsCommitted && !detail.HasBrokenManifestReference)
        {
            AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(detail, runId);

            if (Guid.TryParse(runId.Trim(), out Guid runGuid))
            {
                ScopeContext exportScope = _scopeProvider.GetCurrentScope();

                await RunExportSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
                    runId.Trim(),
                    exportScope,
                    _authorityQueryService,
                    _manifestHashService,
                    cancellationToken);

                await ManifestDecisionReceiptExportBinder.EnsureSealedExportReceiptVerifiedOrThrowAsync(
                    runGuid,
                    runId.Trim(),
                    _authorityQueryService,
                    _manifestHashService,
                    exportScope,
                    cancellationToken);
            }
        }

        PilotRunDeltas deltas = await _deltaComputer.ComputeAsync(detail, cancellationToken);
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        DateTimeOffset end = TimeProvider.System.GetUtcNow();
        DateTimeOffset start = end.AddDays(-30);
        ValueReportSnapshot valueWindowSnapshot =
            await _valueReportBuilder.BuildAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, start, end, cancellationToken);
        PilotBaselineRecord? scorecardBaselines =
            await _pilotBaselineRepository.GetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);
        ArchitectureRun run = detail.Run;
        GoldenManifest? manifest = detail.Manifest;
        PilotBuyerSafeEvidenceGateResult buyerSafeGate = PilotBuyerSafeEvidenceGateEvaluator.Evaluate(run, manifest, deltas, valueWindowSnapshot);
        FirstValueEvidenceCompletenessLevel evidenceCompleteness = FirstValueEvidenceCompletenessClassifier.Classify(buyerSafeGate);
        SponsorSafeProofDisposition sponsorSafeDisposition = SponsorSafeProofStatusMarkdownFormatter.ResolveDisposition(buyerSafeGate);
        ProofPackageCompletenessResponse proofCompleteness =
            PilotProofPackageCompletenessMapper.Build(run, manifest, deltas, buyerSafeGate, valueWindowSnapshot, scorecardBaselines);
        SponsorRoiClaimDispositionResult roiClaimGate = SponsorRoiClaimDispositionResolver.Resolve(
            valueWindowSnapshot,
            proofCompleteness.RoiBaselineInputs,
            deltas.IsDemoTenant);
        StringBuilder sb = new();
        sb.AppendLine("# ArchLucid — first value report (pilot)");
        sb.AppendLine();
        TenantReportBrandingForExport? tenantBranding =
            await _reportBrandingApplyHelper.ResolveForExportAsync(
                scope.TenantId,
                BrandingDisplayContext.ReportCover,
                baseUrl,
                cancellationToken).ConfigureAwait(false);
        TenantReportBrandingApplier.AppendFirstValueReportMarkdownPreamble(sb, tenantBranding);
        sb.AppendLine(
            "This one-page summary is generated from committed run data in ArchLucid. The **computed deltas** below replace the legacy baseline placeholders for the numbers ArchLucid can derive on its own; the qualitative baseline table at the bottom is still operator-filled. See repository `docs/PILOT_ROI_MODEL.md` Â§4 for the full metric catalog.");
        sb.AppendLine();
        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(sb, detail, sponsorSafeDisposition, proofCompleteness, deltas, run, roiClaimGate);
        SponsorReviewCoverageHonestyContext coverageHonesty = await SponsorReviewCoverageHonestyMaterialLoader.LoadAsync(
            detail,
            _authorityQueryService,
            _graphSnapshotRepository,
            scope,
            cancellationToken);
        SponsorReviewCoverageHonestyMarkdownFormatter.AppendMarkdownSection(sb, coverageHonesty);
        SponsorSafeProofStatusMarkdownFormatter.AppendMarkdownSection(sb, sponsorSafeDisposition, buyerSafeGate, proofCompleteness, deltas, run);
        SponsorDecisionDeltaNoveltyResult decisionDeltaNovelty = SponsorDecisionDeltaNoveltyResolver.Resolve(
            detail,
            deltas,
            proofCompleteness,
            buyerSafeGate);
        SponsorDecisionDeltaNoveltyMarkdownFormatter.AppendMarkdownSections(sb, decisionDeltaNovelty);

        DateTime? extractorCollectionTimestampUtc = await _roiCostEvidenceCollectionResolver
            .TryResolveLatestCollectionTimestampUtcAsync(scope, run.RunId, cancellationToken)
            .ConfigureAwait(false);

        bool hasUploadedCostEvidence = extractorCollectionTimestampUtc is not null
            || await _roiCostEvidenceCollectionResolver
                .HasAnyUploadedInventoryPackagesAsync(scope, cancellationToken)
                .ConfigureAwait(false);

        string costEvidenceFreshnessForBadges = ResolveCostEvidenceFreshnessForBadges(
            proofCompleteness,
            deltas,
            extractorCollectionTimestampUtc);

        SponsorArtifactEvidenceBadgeMarkdownFormatter.AppendMarkdownSection(
            sb,
            deltas,
            proofCompleteness,
            valueWindowSnapshot,
            ResolveSavingsPricingBasisForBadges(proofCompleteness, deltas, hasUploadedCostEvidence),
            costEvidenceFreshnessForBadges);
        SponsorEvidenceBasisVerdictMarkdownFormatter.AppendMarkdownSection(sb, proofCompleteness, deltas, run);
        if (run.RealModeFellBackToSimulator)
        {
            sb.AppendLine(_executionProvenanceFooter.BuildYellowSimulatorSubstitutionCallout());
            sb.AppendLine();
        }

        if (deltas.IsDemoTenant)
        {
            sb.AppendLine("> " + FirstValueReportDeltasSectionFormatter.DemoTenantBanner +
                          " The numbers below come from the seeded Retail Checkout Modernization demo dataset and MUST NOT be quoted as a real-customer outcome.");
            sb.AppendLine();
        }

        FirstValueEvidenceCompletenessMarkdownFormatter.AppendMarkdownSection(sb, evidenceCompleteness);
        PilotBuyerSafeEvidenceGateMarkdownFormatter.AppendMarkdownSection(sb, buyerSafeGate);
        FirstValueReportRunSectionFormatter.AppendMarkdownSection(sb, run, manifest, baseUrl);
        FirstValueReportProofPackageSectionFormatter.AppendMarkdownSection(sb, deltas, proofCompleteness, manifest, run);
        FirstValueReportDeltasSectionFormatter.AppendComputedDeltasSection(sb, deltas);
        SponsorRoiNarrativeGateMarkdownFormatter.AppendMarkdownSection(sb, roiClaimGate);
        ValueReportReviewCycleSectionFormatter.AppendMarkdownSection(sb, valueWindowSnapshot, roiClaimGate.Disposition);
        RoiEvidenceCompletenessMarkdownFormatter.AppendMarkdownSection(sb, valueWindowSnapshot, roiClaimGate);
        RoiMetricSourceMarkdownFormatter.AppendMarkdownSection(
            sb,
            RoiMetricSourceCatalogBuilder.Build(valueWindowSnapshot));

        if (proofCompleteness.RoiBaselineInputs is not null)
            PilotRoiBaselineInputsMarkdownFormatter.AppendMarkdownSection(sb, proofCompleteness.RoiBaselineInputs);
        FirstValueReportFindingFeedbackSectionFormatter.AppendMarkdownSection(sb, valueWindowSnapshot);
        FirstValueReportDeltasSectionFormatter.AppendFindingsSection(sb, deltas);
        FirstValueReportDeltasSectionFormatter.AppendElapsedSection(sb, deltas);
        FirstValueReportTraceSectionFormatter.AppendDecisionTraceSection(sb, detail, runId, baseUrl);
        FirstValueReportTraceSectionFormatter.AppendEvidenceChainSection(sb, deltas);
        FindingTrustEvidenceCardMarkdownFormatter.AppendMarkdownSection(sb, deltas, proofCompleteness, run);
        FirstValueReportBaselineSectionFormatter.AppendMarkdownSection(sb);
        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine();
        sb.AppendLine(_executionProvenanceFooter.BuildFooterMarkdown(BuildProvenanceInput(run, deltas)));
        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine();
        sb.AppendLine("**Sponsor narrative (canonical):** repository `docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md` (not served by this HTTP endpoint).");
        sb.AppendLine();
        sb.AppendLine($"*Generated from run `{run.RunId}`.*");
        sb.AppendLine();
        string ui = _publicSiteOptions.CurrentValue.BaseUrl.Trim().TrimEnd('/');
        sb.AppendLine("## Return to ArchLucid (authoritative state)");
        sb.AppendLine();
        sb.AppendLine($"- Operator review UI: {ui}/reviews/{run.RunId}");
        sb.AppendLine($"- Pilot scorecard: {ui}/scorecard");
        sb.AppendLine($"- API anchor (authenticated): {baseUrl}/v1/architecture/review/{run.RunId}");
        return new FirstValueReportBuildResult(
            sb.ToString(),
            evidenceCompleteness,
            SponsorProofReadinessClassifier.Classify(deltas, buyerSafeGate),
            tenantBranding,
            proofCompleteness);
    }

    private ExecutionProvenanceFooterInput BuildProvenanceInput(ArchitectureRun run, PilotRunDeltas deltas)
    {
        string hostMode = _configuration["AgentExecution:Mode"]?.Trim() ?? "Simulator";
        string? hostDeployment = _configuration["AzureOpenAI:DeploymentName"]?.Trim();
        return new ExecutionProvenanceFooterInput(run.StructuralExecutionMode, run.RealModeFellBackToSimulator, run.PilotAoaiDeploymentSnapshot, hostMode, hostDeployment,
            deltas.LlmCallCount);
    }

    private static string ResolveSavingsPricingBasisForBadges(
        ProofPackageCompletenessResponse proof,
        PilotRunDeltas deltas,
        bool hasUploadedCostEvidence)
    {
        return SponsorRoiSavingsPricingBasis.Resolve(
            1.0m,
            hasUploadedCostEvidence,
            hasHeuristicCostEvidence: !hasUploadedCostEvidence
                && proof.RoiEvidenceConfidence is PilotRoiEvidenceConfidence.Partial or PilotRoiEvidenceConfidence.Low
                && !deltas.IsDemoTenant);
    }

    private string ResolveCostEvidenceFreshnessForBadges(
        ProofPackageCompletenessResponse proof,
        PilotRunDeltas deltas,
        DateTime? extractorCollectionTimestampUtc)
    {
        int configuredStaleAfterDays = _roiCostEvidenceFreshnessOptions.StaleAfterDays <= 0
            ? 90
            : _roiCostEvidenceFreshnessOptions.StaleAfterDays;

        int sponsorHandoffStaleAfterDays = (int)RoiMetricSourceFreshnessRules.StaleExtractorThreshold.TotalDays;
        int staleAfterDays = Math.Min(configuredStaleAfterDays, sponsorHandoffStaleAfterDays);

        return PilotCostEvidenceFreshnessBadgeResolver.Resolve(
            extractorCollectionTimestampUtc,
            deltas.IsDemoTenant || proof.DemoTenantWarningRequired,
            TimeProvider.System.UtcNowDateTime(),
            staleAfterDays);
    }
}
