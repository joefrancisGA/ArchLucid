using System.Text;

using ArchLucid.Application.Determinism;
using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Agents;

namespace ArchLucid.Application.Analysis;

public sealed partial class MarkdownArchitectureAnalysisExportService
{
    private static void AppendDeterminismAndDiffs(StringBuilder sb, ArchitectureAnalysisReport report)
    {
        bool hasCompareArtifacts =
            report.Determinism is not null
            || report.ManifestDiff is not null
            || report.AgentResultDiff is not null;

        if (!hasCompareArtifacts)
        {
            return;
        }

        if (report.Determinism is not null)
        {
            sb.AppendLine("## Determinism Check");
            sb.AppendLine();
            sb.AppendLine(
                $"- Source Run ID: {FormatDeterminismRunId(report.Determinism.SourceRunId, "Source run ID was not stored.")}");
            sb.AppendLine($"- Iterations: {report.Determinism.Iterations}");
            sb.AppendLine($"- Execution Mode: {report.Determinism.ExecutionMode}");
            sb.AppendLine($"- Is Deterministic: {(report.Determinism.IsDeterministic ? "Yes" : "No")}");
            sb.AppendLine(
                $"- Baseline Replay Run ID: {FormatDeterminismRunId(report.Determinism.BaselineReplayRunId, "Baseline replay run ID was not stored.")}");
            sb.AppendLine();

            foreach (DeterminismIterationResult iteration in report.Determinism.IterationResults.OrderBy(x =>
                         x.IterationNumber))
            {
                sb.AppendLine($"### Iteration {iteration.IterationNumber}");
                sb.AppendLine();
                sb.AppendLine(
                    $"- Replay Run ID: {DeterminismExportHonestyCopy.FormatReplayRunId(iteration.ReplayRunId)}");
                sb.AppendLine(
                    $"- Matches Baseline Agent Results: {DeterminismExportHonestyCopy.FormatAgentResultsMatch(iteration.MatchesBaselineAgentResults)}");
                sb.AppendLine(
                    $"- Matches Baseline Manifest: {DeterminismExportHonestyCopy.FormatManifestMatch(iteration)}");

                if (iteration.AgentDriftWarnings.Count > 0)
                {
                    sb.AppendLine("- Agent Drift Warnings:");
                    sb.AppendLine(string.Join(Environment.NewLine,
                        iteration.AgentDriftWarnings.Select(static warning => $"  - {warning}")));
                }

                if (iteration.ManifestDriftWarnings.Count > 0)
                {
                    sb.AppendLine("- Manifest Drift Warnings:");
                    sb.AppendLine(string.Join(Environment.NewLine,
                        iteration.ManifestDriftWarnings.Select(static warning => $"  - {warning}")));
                }

                sb.AppendLine();
            }
        }
        else
        {
            sb.AppendLine("## Determinism Check");
            sb.AppendLine();
            sb.AppendLine($"- {ConsultingDocxAppendixHonestyCopy.DeterminismCheckNotStored}");
            sb.AppendLine();
        }

        if (report.ManifestDiff is not null)
        {
            sb.AppendLine("## Manifest Diff");
            sb.AppendLine();
            AppendList(sb, "Added Services", report.ManifestDiff.AddedServices);
            AppendList(sb, "Removed Services", report.ManifestDiff.RemovedServices);
            AppendList(sb, "Added Datastores", report.ManifestDiff.AddedDatastores);
            AppendList(sb, "Removed Datastores", report.ManifestDiff.RemovedDatastores);
            AppendList(sb, "Added Required Controls", report.ManifestDiff.AddedRequiredControls);
            AppendList(sb, "Removed Required Controls", report.ManifestDiff.RemovedRequiredControls);
            AppendList(
                sb,
                "Added Relationships",
                report.ManifestDiff.AddedRelationships.Select(static relationship => relationship.ToDisplayLine()).ToList());
            AppendList(
                sb,
                "Removed Relationships",
                report.ManifestDiff.RemovedRelationships.Select(static relationship => relationship.ToDisplayLine()).ToList());

            if (report.ManifestDiff.Warnings.Count > 0)

                AppendList(sb, "Warnings", report.ManifestDiff.Warnings);
        }
        else
        {
            sb.AppendLine("## Manifest Diff");
            sb.AppendLine();
            sb.AppendLine($"- {ConsultingDocxAppendixHonestyCopy.ManifestDiffNotStored}");
            sb.AppendLine();
        }

        if (report.AgentResultDiff is null)
        {
            sb.AppendLine("## Agent Result Diff");
            sb.AppendLine();
            sb.AppendLine($"- {ConsultingDocxAppendixHonestyCopy.AgentResultDiffNotStored}");
            sb.AppendLine();

            return;
        }

        sb.AppendLine("## Agent Result Diff");
        sb.AppendLine();

        foreach (AgentResultDelta delta in report.AgentResultDiff.AgentDeltas.OrderBy(x => x.AgentType))
        {
            sb.AppendLine($"### {delta.AgentType}");
            sb.AppendLine();
            sb.AppendLine($"- Left Exists: {(delta.LeftExists ? "Yes" : "No")}");
            sb.AppendLine($"- Right Exists: {(delta.RightExists ? "Yes" : "No")}");
            sb.AppendLine(
                $"- Left Confidence: {AgentResultConfidenceDisplay.Format(delta.LeftConfidence, "Left confidence was not stored.")}");
            sb.AppendLine(
                $"- Right Confidence: {AgentResultConfidenceDisplay.Format(delta.RightConfidence, "Right confidence was not stored.")}");
            sb.AppendLine();

            AppendList(sb, "Added Claims", delta.AddedClaims);
            AppendList(sb, "Removed Claims", delta.RemovedClaims);
            AppendList(sb, "Added Evidence References", delta.AddedEvidenceRefs);
            AppendList(sb, "Removed Evidence References", delta.RemovedEvidenceRefs);
            AppendList(sb, "Added Findings", delta.AddedFindings);
            AppendList(sb, "Removed Findings", delta.RemovedFindings);
            AppendList(sb, "Added Required Controls", delta.AddedRequiredControls);
            AppendList(sb, "Removed Required Controls", delta.RemovedRequiredControls);
            AppendList(sb, "Added Warnings", delta.AddedWarnings);
            AppendList(sb, "Removed Warnings", delta.RemovedWarnings);
        }
    }

    private static void AppendList(StringBuilder sb, string title, IReadOnlyCollection<string> items)
    {
        sb.AppendLine($"#### {title}");
        sb.AppendLine();

        if (items.Count == 0)
        {
            sb.AppendLine($"- {ArchitectureEvidenceRequestExport.EmptyDiffListBulletCopy}");
            sb.AppendLine();
            return;
        }

        sb.AppendLine(string.Join(
            Environment.NewLine,
            items.Select(static item => $"- {ArchitectureEvidenceRequestExport.FormatDiffListEntry(item)}")));

        sb.AppendLine();
    }
}
