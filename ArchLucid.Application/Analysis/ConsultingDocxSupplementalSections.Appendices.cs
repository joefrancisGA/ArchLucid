using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;

using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.Application.Analysis;

internal static partial class ConsultingDocxSupplementalSections
{
    public static void AddAppendices(
        Body body,
        ArchitectureAnalysisReport report,
        ConsultingDocxTemplateOptions options)
    {
        if (options.IncludeAppendixMermaid)
        {
            ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Appendix A. Mermaid Source", 1);

            if (!string.IsNullOrWhiteSpace(report.Diagram))

                ConsultingDocxOpenXmlPrimitives.AddCodeBlock(body, report.Diagram,
                    ConsultingDocxOpenXmlPrimitives.MermaidLanguage);

            else

                ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, ConsultingDocxAppendixHonestyCopy.MermaidSourceNotStored,
                    "BodyText");

            ConsultingDocxOpenXmlPrimitives.AddPageBreak(body);
        }

        if (options.IncludeAppendixExecutionTraceIndex)
        {
            ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Appendix B. Execution Trace Index", 1);

            if (report.ExecutionTraces.Count > 0)

                foreach (AgentExecutionTrace trace in report.ExecutionTraces.OrderBy(x => x.AgentType)
                             .ThenBy(x => x.CreatedUtc))

                    ConsultingDocxOpenXmlPrimitives.AddBullet(
                        body,
                        $"{trace.AgentType} | Task {(string.IsNullOrWhiteSpace(trace.TaskId) ? "Task id was not stored." : trace.TaskId.Trim())} | Parse {(trace.ParseSucceeded ? "Succeeded" : "Failed")} | {trace.CreatedUtc:O}");

            else

                ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, ConsultingDocxAppendixHonestyCopy.ExecutionTraceIndexNotStored,
                    "BodyText");

            ConsultingDocxOpenXmlPrimitives.AddPageBreak(body);
        }

        if (!options.IncludeAppendixDeterminismAndComparison)
            return;

        ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Appendix C. Determinism and Comparison", 1);

        if (report.Determinism is not null)
        {
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, "Determinism", "Strong");
            ConsultingDocxOpenXmlPrimitives.AddBullet(body, $"Iterations: {report.Determinism.Iterations}");
            ConsultingDocxOpenXmlPrimitives.AddBullet(body,
                $"Is Deterministic: {(report.Determinism.IsDeterministic ? "Yes" : "No")}");
        }
        else
        {
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, ConsultingDocxAppendixHonestyCopy.DeterminismCheckNotStored,
                "BodyText");
        }

        if (report.ManifestDiff is not null)
        {
            ConsultingDocxOpenXmlPrimitives.AddSpacer(body);
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, "Manifest Diff", "Strong");
            ConsultingDocxOpenXmlPrimitives.AddBullet(body,
                $"Added Services: {report.ManifestDiff.AddedServices.Count}");
            ConsultingDocxOpenXmlPrimitives.AddBullet(body,
                $"Removed Services: {report.ManifestDiff.RemovedServices.Count}");
            ConsultingDocxOpenXmlPrimitives.AddBullet(body,
                $"Added Datastores: {report.ManifestDiff.AddedDatastores.Count}");
            ConsultingDocxOpenXmlPrimitives.AddBullet(body,
                $"Removed Datastores: {report.ManifestDiff.RemovedDatastores.Count}");
            ConsultingDocxOpenXmlPrimitives.AddBullet(body,
                $"Added Relationships: {report.ManifestDiff.AddedRelationships.Count}");
            ConsultingDocxOpenXmlPrimitives.AddBullet(body,
                $"Removed Relationships: {report.ManifestDiff.RemovedRelationships.Count}");
            ConsultingDocxOpenXmlPrimitives.AddBullet(body,
                $"Added Required Controls: {report.ManifestDiff.AddedRequiredControls.Count}");
            ConsultingDocxOpenXmlPrimitives.AddBullet(body,
                $"Removed Required Controls: {report.ManifestDiff.RemovedRequiredControls.Count}");
            ConsultingDocxOpenXmlPrimitives.AddBullet(body,
                $"Manifest Warnings: {report.ManifestDiff.Warnings.Count}");
        }
        else
        {
            ConsultingDocxOpenXmlPrimitives.AddSpacer(body);
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, ConsultingDocxAppendixHonestyCopy.ManifestDiffNotStored,
                "BodyText");
        }

        if (report.AgentResultDiff is null)
        {
            ConsultingDocxOpenXmlPrimitives.AddSpacer(body);
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, ConsultingDocxAppendixHonestyCopy.AgentResultDiffNotStored,
                "BodyText");

            return;
        }

        ConsultingDocxOpenXmlPrimitives.AddSpacer(body);
        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, "Agent Result Diff", "Strong");
        ConsultingDocxOpenXmlPrimitives.AddBullet(body,
            $"Agent Delta Count: {report.AgentResultDiff.AgentDeltas.Count}");
    }
}
