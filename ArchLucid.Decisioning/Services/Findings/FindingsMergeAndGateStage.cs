using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using Microsoft.Extensions.Options;

namespace ArchLucid.Decisioning.Services.Findings;

public sealed class FindingsMergeAndGateStage(
    IOptions<HumanReviewFindingOptions> humanReviewOptions,
    IOptions<InsightDensityGateOptions> insightDensityGateOptions,
    IFindingProvenanceValidator provenanceValidator,
    TimeProvider? timeProvider = null) : IFindingsMergeAndGateStage
{
    private readonly IOptions<HumanReviewFindingOptions> _humanReviewOptions =
        humanReviewOptions ?? throw new ArgumentNullException(nameof(humanReviewOptions));

    private readonly IOptions<InsightDensityGateOptions> _insightDensityGateOptions =
        insightDensityGateOptions ?? throw new ArgumentNullException(nameof(insightDensityGateOptions));

    private readonly IFindingProvenanceValidator _provenanceValidator =
        provenanceValidator ?? throw new ArgumentNullException(nameof(provenanceValidator));

    private readonly TimeProvider _clock = timeProvider ?? TimeProvider.System;

    public Task ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);
        cancellationToken.ThrowIfCancellationRequested();

        FindingSnapshotMergeResult mergeResult = FindingSnapshotConfluentMerger.Merge(context.AllFindings, _clock);

        foreach (FindingSnapshotMergeConflict conflict in mergeResult.Conflicts)
        {
            context.EngineFailures.Add(conflict.Failure);
            ArchLucidInstrumentation.RecordFindingEngineFailure(conflict.Failure.EngineType, conflict.Failure.Category);
        }

        List<Finding> dedupedFindings = [.. mergeResult.Findings];
        dedupedFindings.AddRange(FindingMergeConflictPresenter.PresentAsFindings(mergeResult.Conflicts, _clock));
        context.DedupedFindingsCount = dedupedFindings.Count;

        if (context.AnalysisContext is not null)
        {
            IReadOnlyList<string> policyViolations = PolicyPackCategoryCoverageValidator.GetMissingCategoryViolations(
                context.AnalysisContext,
                dedupedFindings,
                context.SuccessfulEngineTypes);

            foreach (string violation in policyViolations)
            {
                context.EngineFailures.Add(
                    new FindingEngineFailure
                    {
                        EngineType = "policy-pack-coverage",
                        Category = "Policy",
                        ErrorMessage = violation,
                        ExceptionType = nameof(PolicyPackCategoryCoverageValidator),
                        OccurredUtc = _clock.UtcNowDateTime(),
                    });
            }

            IReadOnlyList<string> engineTypeViolations = PolicyPackCategoryCoverageValidator.GetMissingEngineTypeViolations(
                context.AnalysisContext,
                context.SuccessfulEngineTypes);

            foreach (string violation in engineTypeViolations)
            {
                context.EngineFailures.Add(
                    new FindingEngineFailure
                    {
                        EngineType = "policy-pack-coverage",
                        Category = "Policy",
                        ErrorMessage = violation,
                        ExceptionType = nameof(PolicyPackCategoryCoverageValidator),
                        OccurredUtc = _clock.UtcNowDateTime(),
                    });
            }
        }

        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = context.RunId,
            ContextSnapshotId = context.ContextSnapshotId,
            GraphSnapshotId = context.GraphSnapshot.GraphSnapshotId,
            CreatedUtc = _clock.UtcNowDateTime(),
            Findings = dedupedFindings,
            EngineFailures = context.EngineFailures,
            WithheldFindings = mergeResult.Conflicts.SelectMany(static conflict => conflict.Dropped).ToList(),
            SchemaVersion = FindingsSchema.CurrentSnapshotVersion,
        };

        FindingHumanReviewInitializer.Apply(snapshot.Findings, _humanReviewOptions.Value);

        foreach (Finding finding in snapshot.Findings)
            FindingEnforcementTierClassifier.ApplyToFinding(finding);

        FindingProvenanceEmissionApplicator.EnrichDiagramEvidenceRefs(snapshot.Findings, context.GraphSnapshot);

        DiagramPackageCitationIndex packageDiagramCitationIndex =
            DiagramPackageCitationIndexBuilder.FromGraphSnapshot(context.GraphSnapshot);

        InsightDensityGateOptions scoringOptions =
            InsightDensityGateScoringFactory.CloneOptions(_insightDensityGateOptions.Value);
        scoringOptions.PackageDiagramCitationIndex = packageDiagramCitationIndex;

        IInsightDensityGate scoringGate = new DeterministicInsightDensityGate(
            Microsoft.Extensions.Options.Options.Create(scoringOptions));

        FindingInsightDensityGateApplicator.ApplyToFindings(snapshot.Findings, scoringGate);

        FindingProvenanceEmissionApplicator.Apply(snapshot.Findings, _provenanceValidator);

        snapshot.TotalEstimatedSavings = FindingsSnapshotEstimatedSavingsCalculator.ComputeTotal(snapshot.Findings);

        FindingsSnapshotWithheldAdvisoryEngineFailuresApplicator.Apply(snapshot);

        context.Snapshot = snapshot;
        return Task.CompletedTask;
    }
}
