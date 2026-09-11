using ArchLucid.Application.Drafts;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.CareerArtifacts;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Application.Exports;

/// <inheritdoc />
public sealed class DecisionReceiptService(
    IDraftRequestService draftRequestService,
    IAuthorityQueryService authorityQueryService,
    IRunDetailQueryService runDetailQueryService,
    IManifestHashService manifestHashService,
    FeasibilityVerdictBuilder feasibilityVerdictBuilder,
    IGraphSnapshotRepository graphSnapshotRepository,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IConfiguration configuration,
    IRunRepository runRepository,
    IArchitectureInventoryBindingRepository architectureInventoryBindingRepository) : IDecisionReceiptService
{
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IDraftRequestService _draftRequestService =
        draftRequestService ?? throw new ArgumentNullException(nameof(draftRequestService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly FeasibilityVerdictBuilder _feasibilityVerdictBuilder =
        feasibilityVerdictBuilder ?? throw new ArgumentNullException(nameof(feasibilityVerdictBuilder));

    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureInventoryBindingRepository _architectureInventoryBindingRepository =
        architectureInventoryBindingRepository
        ?? throw new ArgumentNullException(nameof(architectureInventoryBindingRepository));

    /// <inheritdoc />
    public async Task<DecisionReceiptDocument?> BuildForDraftAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken)
    {
        DraftRequestResponse? draft = await _draftRequestService.GetAsync(scope, draftId, cancellationToken);

        if (draft is null)
            return null;

        if (draft.Status != DraftRequestStatus.Redirected)
            return null;

        if (string.IsNullOrWhiteSpace(draft.RedirectReason))
            return null;

        FeasibilityVerdict verdict = _feasibilityVerdictBuilder.FromIntakeRedirect(
            draft.RedirectReason,
            draft.Document.TransparencyTrail,
            "Draft does not yet meet minimum designable-intent requirements.");

        if (!DecisionReceiptComposer.IsExportableVerdict(verdict.Kind))
            return null;

        return DecisionReceiptComposer.BuildForDraft(draft, verdict);
    }

    /// <inheritdoc />
    public async Task<DecisionReceiptRunBuildResult> BuildForRunAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        ArchitectureRunDetail? detail = await _runDetailQueryService
            .GetRunDetailAsync(runId.ToString("N"), cancellationToken);

        if (detail is null)
            return NotFound();

        if (!detail.IsCommitted || detail.HasBrokenManifestReference)
            return NotFound();

        AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(detail, runId.ToString("N"));

        RunSummaryDto? summary = await _authorityQueryService.GetRunSummaryAsync(scope, runId, cancellationToken);

        if (summary is null)
            return NotFound();

        if (summary.GoldenManifestId is null)
            return NotFound();

        RunDetailDto? compareDetail = await _authorityQueryService.GetRunDetailForManifestCompareAsync(
            scope,
            runId,
            cancellationToken);

        if (compareDetail?.GoldenManifest is null)
            return NotFound();

        FeasibilityVerdict? verdict = compareDetail.GoldenManifest.FeasibilityVerdict;
        string? manifestVersion = compareDetail.GoldenManifest.Metadata?.Version;

        DecisionReceiptRunBuildOutcome? readinessOutcome =
            ManifestDecisionReceiptExportBinder.TryGetSealedReceiptReadinessOutcome(
                compareDetail.GoldenManifest,
                verdict,
                manifestVersion);

        if (readinessOutcome == DecisionReceiptRunBuildOutcome.SealedReceiptIncomplete)
        {
            return new DecisionReceiptRunBuildResult
            {
                Outcome = DecisionReceiptRunBuildOutcome.SealedReceiptIncomplete,
            };
        }

        CareerExportCoverageHonestyInput careerExportHonesty = await CareerExportCoverageHonestyMaterialLoader.LoadAsync(
            detail,
            _authorityQueryService,
            _graphSnapshotRepository,
            _agentExecutionTraceRepository,
            scope,
            workingDesk: true,
            _configuration,
            cancellationToken,
            _runRepository,
            _architectureInventoryBindingRepository);

        CareerArtifactCompletenessResult careerArtifactResult = new CareerArtifactCompletenessValidator().Evaluate(
            CareerArtifactCompletenessInputMapper.MapForExport(
                careerExportHonesty,
                verdict?.TransparencyTrail));

        if (!careerArtifactResult.CanRender)
        {
            CareerArtifactBlockReason primaryBlock = careerArtifactResult.BlockReasons[0];

            return new DecisionReceiptRunBuildResult
            {
                Outcome = DecisionReceiptRunBuildOutcome.CareerArtifactBlocked,
                BlockReasonCode = primaryBlock.Code,
                BlockReason = primaryBlock.Message,
            };
        }

        await RunExportSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId.ToString("N"),
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        DecisionReceiptRunBuildResult buildResult = ManifestDecisionReceiptExportBinder.BuildVerifiedExportReceipt(
            runId,
            compareDetail.GoldenManifest,
            verdict!,
            manifestVersion!.Trim(),
            _manifestHashService);

        if (buildResult.Outcome == DecisionReceiptRunBuildOutcome.Success && buildResult.Receipt is not null)
        {
            DecisionReceiptCareerPostureStamper.ApplyCommittedRunPosture(buildResult.Receipt, careerExportHonesty);
        }

        return buildResult;
    }

    private static DecisionReceiptRunBuildResult NotFound() =>
        new() { Outcome = DecisionReceiptRunBuildOutcome.NotFound };
}
