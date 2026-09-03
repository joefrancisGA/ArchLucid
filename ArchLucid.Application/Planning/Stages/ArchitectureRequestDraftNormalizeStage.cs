using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Planning.Stages;

/// <inheritdoc cref="IArchitectureRequestDraftNormalizeStage" />
public sealed class ArchitectureRequestDraftNormalizeStage(
    IArchitectureRequestDraftSemanticUniquePass semanticUniquePass,
    IBriefAssumptionEvidenceContradictionPass assumptionEvidenceContradictionPass) : IArchitectureRequestDraftNormalizeStage
{
    private readonly IArchitectureRequestDraftSemanticUniquePass _semanticUniquePass = semanticUniquePass
        ?? throw new ArgumentNullException(nameof(semanticUniquePass));

    private readonly IBriefAssumptionEvidenceContradictionPass _assumptionEvidenceContradictionPass =
        assumptionEvidenceContradictionPass
        ?? throw new ArgumentNullException(nameof(assumptionEvidenceContradictionPass));

    public async Task<DraftArchitectureRequestResponse> NormalizeAsync(
        DraftArchitectureRequestInput input,
        ArchitectureRequestDraftExtractionResult extraction,
        IArchitectureRequestDraftProgress? progress,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(input);
        ArgumentNullException.ThrowIfNull(extraction);

        progress?.ReportStep(AdvisoryDraftOperationSteps.PostProcessing, 3, AdvisoryDraftOperationSteps.TotalSteps);

        Task<string[]> filteredConstraintsTask = _semanticUniquePass.FilterDuplicatesAsync(
            ArchitectureRequestDraftListKind.Constraints,
            extraction.ExistingConstraints,
            extraction.NormalizedConstraints,
            cancellationToken);

        Task<string[]> filteredAssumptionsTask = _semanticUniquePass.FilterDuplicatesAsync(
            ArchitectureRequestDraftListKind.Assumptions,
            extraction.ExistingAssumptions,
            extraction.NormalizedAssumptions,
            cancellationToken);

        Task<IReadOnlyList<EvidenceContradictedBriefAssumption>> contradictionsTask =
            _assumptionEvidenceContradictionPass.DetectAsync(
                input.FreeTextDescription,
                input.ConfirmedAssumptions,
                cancellationToken);

        await Task.WhenAll(filteredConstraintsTask, filteredAssumptionsTask, contradictionsTask);

        string[] filteredConstraints = await filteredConstraintsTask;
        string[] filteredAssumptions = await filteredAssumptionsTask;
        IReadOnlyList<EvidenceContradictedBriefAssumption> evidenceContradictedAssumptions =
            await contradictionsTask;

        progress?.ReportStep(AdvisoryDraftOperationSteps.Completing, 4, AdvisoryDraftOperationSteps.TotalSteps);

        return new DraftArchitectureRequestResponse
        {
            SuggestedConstraints = filteredConstraints,
            SuggestedCapabilities = extraction.SuggestedCapabilities,
            SuggestedAssumptions = filteredAssumptions,
            TopologyHints = extraction.TopologyHints,
            SecurityBaselineHints = extraction.SecurityBaselineHints,
            SuggestedFailureModeNote = extraction.SuggestedFailureModeNote,
            EvidenceContradictedAssumptions = evidenceContradictedAssumptions.ToList(),
        };
    }
}
