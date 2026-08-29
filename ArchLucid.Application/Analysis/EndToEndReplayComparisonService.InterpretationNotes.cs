using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Application.Analysis;

public sealed partial class EndToEndReplayComparisonService
{
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
            bool agentChanged = report.AgentResultDiff.AgentDeltas.Any(d =>
                d.AddedClaims.Count > 0 || d.RemovedClaims.Count > 0 || d.AddedFindings.Count > 0 || d.RemovedFindings.Count > 0 ||
                d.AddedRequiredControls.Count > 0 || d.RemovedRequiredControls.Count > 0 || d.AddedWarnings.Count > 0 || d.RemovedWarnings.Count > 0);
            bool manifestChanged = report.ManifestDiff.AddedServices.Count > 0 || report.ManifestDiff.RemovedServices.Count > 0 ||
                                   report.ManifestDiff.AddedDatastores.Count > 0 || report.ManifestDiff.RemovedDatastores.Count > 0 ||
                                   report.ManifestDiff.AddedRequiredControls.Count > 0 || report.ManifestDiff.RemovedRequiredControls.Count > 0 ||
                                   report.ManifestDiff.AddedRelationships.Count > 0 || report.ManifestDiff.RemovedRelationships.Count > 0;
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
