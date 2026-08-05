using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Exports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Exports;

/// <inheritdoc />
public sealed class DecisionReceiptService(
    IDraftRequestService draftRequestService,
    IAuthorityQueryService authorityQueryService,
    FeasibilityVerdictBuilder feasibilityVerdictBuilder) : IDecisionReceiptService
{
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IDraftRequestService _draftRequestService =
        draftRequestService ?? throw new ArgumentNullException(nameof(draftRequestService));

    private readonly FeasibilityVerdictBuilder _feasibilityVerdictBuilder =
        feasibilityVerdictBuilder ?? throw new ArgumentNullException(nameof(feasibilityVerdictBuilder));

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
    public async Task<DecisionReceiptDocument?> BuildForRunAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        RunSummaryDto? summary = await _authorityQueryService.GetRunSummaryAsync(scope, runId, cancellationToken);

        if (summary is null)
            return null;

        if (summary.GoldenManifestId is null)
            return null;

        ManifestSummaryDto? manifestSummary = await _authorityQueryService.GetManifestSummaryAsync(
            scope,
            summary.GoldenManifestId.Value,
            cancellationToken);

        FeasibilityVerdict? verdict = manifestSummary?.FeasibilityVerdict;

        if (verdict is null || !DecisionReceiptComposer.IsExportableVerdict(verdict.Kind))
            return null;

        return DecisionReceiptComposer.BuildForRun(runId, verdict);
    }
}
