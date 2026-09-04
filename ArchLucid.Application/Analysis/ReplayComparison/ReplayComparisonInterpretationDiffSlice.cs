using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Application.Analysis.ReplayComparison;

/// <inheritdoc cref="IReplayComparisonDiffSlice" />
public sealed class ReplayComparisonInterpretationDiffSlice : IReplayComparisonDiffSlice
{
    public Task ApplyAsync(ReplayComparisonBuildContext context, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        AddInterpretationNotes(
            context.Report,
            context.LeftEngineProvenance,
            context.RightEngineProvenance);

        return Task.CompletedTask;
    }

    private static void AddInterpretationNotes(
        EndToEndReplayComparisonReport report,
        ReviewRunEngineProvenance? leftEngineProvenance,
        ReviewRunEngineProvenance? rightEngineProvenance)
    {
        ArgumentNullException.ThrowIfNull(report);

        string? engineNote = BuildLeadingEngineInterpretationNote(
            report,
            leftEngineProvenance,
            rightEngineProvenance);

        if (engineNote is not null)
        {
            report.InterpretationNotes.Add(engineNote);
        }

        if (report.RunDiff.ExecutionModesDiffer)
        {
            report.InterpretationNotes.Add(
                "Structural execution mode differs between the two reviews — finding, cost, and narrative deltas may not be directly comparable. Confirm per-finding trust labels on inspect and export paths.");
        }
        else if (report.RunDiff.SharedNonRealExecutionMode)
        {
            report.InterpretationNotes.Add(
                "Both reviews used the same non-real structural execution mode — treat finding and cost deltas as directional only and confirm per-finding trust labels on inspect and export paths.");
        }

        if (report.AgentResultDiff is not null && report.ManifestDiff is not null)
        {
            bool agentChanged = AgentOutputsChangedMaterially(report.AgentResultDiff);
            bool manifestChanged = ManifestChangedMaterially(report.ManifestDiff);

            if (agentChanged && manifestChanged)
                report.InterpretationNotes.Add(
                    "Both agent outputs and resolved manifest changed, suggesting upstream proposal drift propagated into architecture state.");
            else if (!agentChanged && manifestChanged)
                report.InterpretationNotes.Add(
                    "The manifest changed without meaningful agent drift, which suggests merge logic or manifest ancestry differences.");
            else if (agentChanged && !manifestChanged)
                report.InterpretationNotes.Add(
                    "Agent outputs changed, but the resolved manifest remained stable, suggesting merge logic absorbed or normalized the drift.");
            else
                report.InterpretationNotes.Add("Neither agent outputs nor manifest changed materially.");
        }
        else if (report.AgentResultDiff is not null && AgentOutputsChangedMaterially(report.AgentResultDiff))
        {
            report.InterpretationNotes.Add(
                "Agent outputs changed, but the resolved manifest was not compared — confirm completion state and manifest availability on both runs.");
        }
        else if (report.ManifestDiff is not null && ManifestChangedMaterially(report.ManifestDiff))
        {
            report.InterpretationNotes.Add(
                "The resolved manifest changed, but agent outputs were not compared — confirm agent result availability on both runs.");
        }
        else if (report.RunDiff.ManifestVersionsDiffer)
        {
            report.InterpretationNotes.Add(
                "Current manifest version metadata differs between the two reviews but resolved manifest bodies were not compared — confirm completion state and manifest availability on both runs.");
        }

        if (report.ExportDiffs.Any(d => d.ChangedTopLevelFields.Count > 0 || d.RequestDiff.ChangedFlags.Count > 0 || d.RequestDiff.ChangedValues.Count > 0))
            report.InterpretationNotes.Add(
                "Export configuration differences were detected, so document outputs may differ even when architecture state is similar.");
    }

    private static string? BuildLeadingEngineInterpretationNote(
        EndToEndReplayComparisonReport report,
        ReviewRunEngineProvenance? leftEngineProvenance,
        ReviewRunEngineProvenance? rightEngineProvenance)
    {
        ArgumentNullException.ThrowIfNull(report);

        bool modelAliasIdsDiffer = report.RunDiff.ModelAliasIdsDiffer;
        bool notEvaluated = HasNotEvaluatedSnapshot(leftEngineProvenance)
            || HasNotEvaluatedSnapshot(rightEngineProvenance);

        if (!modelAliasIdsDiffer && !notEvaluated)
        {
            return null;
        }

        List<string> parts = [];

        if (modelAliasIdsDiffer)
        {
            parts.Add(
                "Catalog model alias differs between the two reviews — attribute finding and narrative drift to engine selection before inferring architecture or policy changes.");
        }

        if (notEvaluated)
        {
            parts.Add(
                "At least one review recorded a task evaluation state of NotEvaluated at selection — hash equality does not imply the catalog engine was evaluated.");
        }

        return string.Join(' ', parts);
    }

    private static bool AgentOutputsChangedMaterially(AgentResultDiffResult agentResultDiff) =>
        AgentResultDeltaMateriality.AnyMaterialChanges(agentResultDiff.AgentDeltas);

    private static bool ManifestChangedMaterially(ManifestDiffResult manifestDiff)
    {
        return manifestDiff.AddedServices.Count > 0 || manifestDiff.RemovedServices.Count > 0 ||
               manifestDiff.AddedDatastores.Count > 0 || manifestDiff.RemovedDatastores.Count > 0 ||
               manifestDiff.AddedRequiredControls.Count > 0 || manifestDiff.RemovedRequiredControls.Count > 0 ||
               manifestDiff.AddedRelationships.Count > 0 || manifestDiff.RemovedRelationships.Count > 0 ||
               manifestDiff.Warnings.Count > 0;
    }

    private static bool HasNotEvaluatedSnapshot(ReviewRunEngineProvenance? provenance)
    {
        if (provenance?.TaskEvaluationSnapshotsAtSelection is null)
        {
            return false;
        }

        return provenance.TaskEvaluationSnapshotsAtSelection.Any(snapshot =>
            snapshot is not null
            && string.Equals(snapshot.EvaluationState, "NotEvaluated", StringComparison.OrdinalIgnoreCase));
    }
}
