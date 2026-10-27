using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;

using DocumentFormat.OpenXml.Wordprocessing;

namespace ArchLucid.Application.Analysis;

internal static class ConsultingDocxFindingsSectionBuilder
{
    public static void Add(Body body, ArchitectureAnalysisReport report)
    {
        ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Evidence and Constraints", 1);

        if (report.Evidence is null)
        {
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(
                body,
                ArchitectureEvidenceRequestExport.MissingEvidencePackageCopy,
                "BodyText");

            return;
        }

        ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Request Context", 2);
        ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(
            body,
            ArchitectureEvidenceRequestExport.FormatDescription(report.Evidence.Request.Description),
            "BodyText");

        if (report.Evidence.Request.Constraints.Count > 0)
        {
            ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Constraints", 2);

            foreach (string item in report.Evidence.Request.Constraints)

                ConsultingDocxOpenXmlPrimitives.AddBullet(body, item);
        }
        else
        {
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(
                body,
                ArchitectureEvidenceRequestExport.ConstraintsNotRecordedCopy,
                "BodyText");
        }

        if (report.Evidence.Request.RequiredCapabilities.Count > 0)
        {
            ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Required Capabilities", 2);

            foreach (string item in report.Evidence.Request.RequiredCapabilities)

                ConsultingDocxOpenXmlPrimitives.AddBullet(body, item);
        }
        else
        {
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(
                body,
                ArchitectureEvidenceRequestExport.RequiredCapabilitiesNotRecordedCopy,
                "BodyText");
        }

        ConsultingDocxOpenXmlPrimitives.AddHeading(body, "Policy Evidence", 2);

        if (report.Evidence.Policies.Count == 0)
        {
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(
                body,
                ArchitectureEvidenceRequestExport.PolicyEvidenceNotRecordedCopy,
                "BodyText");

            return;
        }

        foreach (PolicyEvidence policy in report.Evidence.Policies.OrderBy(x => x.Title))
        {
            string policyTitle = ArchitectureEvidenceRequestExport.FormatIdentityField(
                policy.Title,
                ArchitectureEvidenceRequestExport.PolicyTitleNotStoredCopy);
            ConsultingDocxOpenXmlPrimitives.AddStyledParagraph(body, policyTitle, "Strong");
            ConsultingDocxOpenXmlPrimitives.AddBullet(
                body,
                $"Policy ID: {ArchitectureEvidenceRequestExport.FormatIdentityField(policy.PolicyId, ArchitectureEvidenceRequestExport.PolicyIdNotStoredCopy)}");
            ConsultingDocxOpenXmlPrimitives.AddBullet(
                body,
                $"Summary: {ArchitectureEvidenceRequestExport.FormatSummary(policy.Summary, ArchitectureEvidenceRequestExport.PolicySummaryNotStoredCopy)}");

            if (policy.RequiredControls.Count > 0)
            {
                ConsultingDocxOpenXmlPrimitives.AddBullet(
                    body,
                    $"Required Controls: {string.Join(", ", policy.RequiredControls)}");
            }
            else
            {
                ConsultingDocxOpenXmlPrimitives.AddBullet(
                    body,
                    $"Required Controls: {ArchitectureEvidenceRequestExport.RequiredControlsNotRecordedCopy}");
            }
        }
    }
}
