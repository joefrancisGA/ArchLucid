using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

public static partial class ArchitectureReviewBoardExportDocumentFactory
{
    private const int MaxKeyRiskRows = 25;

    private const int MaxPolicyConstraintRows = 20;

    private const int MaxPolicyControlRows = 30;

    private static List<ArchitectureReviewBoardExportRiskRow> BuildKeyRisks(ArchitectureAnalysisReport report, ArchitectureRunDetail detail)
    {
        List<ArchitectureReviewBoardExportRiskRow> risks = [];
        GoldenManifest? m = report.Manifest ?? detail.Manifest;

        if (m is not null)
        {
            string riskClassification = ArchitectureManifestGovernanceExport.FormatRiskClassificationForExport(m.Governance);

            if (!string.Equals(
                    riskClassification,
                    ArchitectureManifestGovernanceExport.RiskClassificationNotStoredLabel,
                    StringComparison.Ordinal))
            {
                risks.Add(
                    new ArchitectureReviewBoardExportRiskRow
                    {
                        SeverityLabel = "Severity was not stored.",
                        Summary = $"Architecture snapshot risk classification is {riskClassification}.",
                        Detail = "Derived from committed governance metadata on the golden manifest."
                    });
            }
        }

        IReadOnlyList<string> warnings = report.Warnings ?? [];
        int warningsListed = 0;

        foreach (string warning in warnings)
        {
            if (warning is null)
            {
                continue;
            }

            if (risks.Count >= MaxKeyRiskRows)
            {
                break;
            }

            if (string.IsNullOrWhiteSpace(warning))
            {
                risks.Add(
                    new ArchitectureReviewBoardExportRiskRow
                    {
                        SeverityLabel = "Analysis warning",
                        Summary = ArchitectureReviewBoardExportHonestyCopy.AnalysisWarningStoredEmpty,
                    });
            }
            else
            {
                risks.Add(
                    new ArchitectureReviewBoardExportRiskRow
                    {
                        SeverityLabel = "Analysis warning",
                        Summary = warning.Trim()
                    });
            }

            warningsListed++;
        }

        int warningsTotal = warnings.Count(warning => warning is not null);

        if (warningsTotal > warningsListed)
        {
            int omitted = warningsTotal - warningsListed;
            ArchitectureReviewBoardExportRiskRow remainder = new()
            {
                SeverityLabel = "Analysis warning",
                Summary = ArchitectureReviewBoardExportHonestyCopy.AdditionalKeyRisksOmittedDetail(omitted),
            };

            if (risks.Count >= MaxKeyRiskRows
                && risks[^1].SeverityLabel == "Analysis warning")
            {
                risks[^1] = remainder;
            }
            else if (risks.Count < MaxKeyRiskRows)
            {
                risks.Add(remainder);
            }
        }

        return risks;
    }

    private static List<ArchitectureReviewBoardExportPolicyFindingRow> BuildPolicyFindings(ArchitectureRunDetail detail)
    {
        GoldenManifest? m = detail.Manifest;

        if (m is null)
            return [];

        List<ArchitectureReviewBoardExportPolicyFindingRow> rows = [];

        foreach (string constraint in m.Governance.PolicyConstraints ?? [])
        {
            if (constraint is null)
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(constraint))
            {
                rows.Add(
                    new ArchitectureReviewBoardExportPolicyFindingRow
                    {
                        PolicyPackNameOrId = "Policy pack name was not stored.",
                        Outcome = ArchitectureReviewBoardExportHonestyCopy.GovernanceConstraintStoredEmpty,
                        Detail = "Governance constraint text was stored empty on the architecture snapshot.",
                    });

                if (rows.Count >= MaxPolicyConstraintRows)
                {
                    break;
                }

                continue;
            }

            rows.Add(
                new ArchitectureReviewBoardExportPolicyFindingRow
                {
                    PolicyPackNameOrId = "Policy pack name was not stored.",
                    Outcome = constraint.Trim(),
                    Detail = "Governance constraint text was stored on the architecture snapshot."
                });

            if (rows.Count >= MaxPolicyConstraintRows)
                break;
        }

        foreach (string control in m.Governance.RequiredControls ?? [])
        {
            if (control is null)
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(control))
            {
                rows.Add(
                    new ArchitectureReviewBoardExportPolicyFindingRow
                    {
                        PolicyPackNameOrId = "Policy pack name was not stored.",
                        Outcome = ArchitectureReviewBoardExportHonestyCopy.RequiredControlStoredEmpty,
                        Detail = "Required control text was stored empty on the architecture snapshot.",
                    });

                if (rows.Count >= MaxPolicyControlRows)
                {
                    break;
                }

                continue;
            }

            rows.Add(
                new ArchitectureReviewBoardExportPolicyFindingRow
                {
                    PolicyPackNameOrId = "Policy pack name was not stored.",
                    Outcome = control.Trim(),
                    Detail = "Required control text was stored on the architecture snapshot."
                });

            if (rows.Count >= MaxPolicyControlRows)
                break;
        }

        return rows;
    }

    private static List<ArchitectureReviewBoardExportDispositionItem> BuildAiDisposition(ArchitectureAnalysisReport report)
    {
        List<ArchitectureReviewBoardExportDispositionItem> items = [];

        foreach (string w in report.Warnings ?? [])
        {
            if (string.IsNullOrWhiteSpace(w))
                continue;

            items.Add(
                new ArchitectureReviewBoardExportDispositionItem
                {
                    Summary = w.Trim(),
                    Context = "Operator disposition required before treating as authoritative governance signal."
                });

            if (items.Count >= 20)
                break;
        }

        return items;
    }

    private static List<ArchitectureReviewBoardExportTraceRow> BuildExtraTraceLines(ArchitectureRunDetail detail)
    {
        List<ArchitectureReviewBoardExportTraceRow> rows = [];

        if (detail.Manifest?.Metadata.CreatedUtc is DateTime createdUtc)
            rows.Add(new ArchitectureReviewBoardExportTraceRow { Label = "Architecture snapshot created (UTC)", Value = createdUtc.ToString("O") });

        if (detail.Run.GoldenManifestId is Guid goldenManifestId)
            rows.Add(
                new ArchitectureReviewBoardExportTraceRow { Label = "Reviewed manifest identifier", Value = goldenManifestId.ToString("D") });
        else
            rows.Add(
                new ArchitectureReviewBoardExportTraceRow
                {
                    Label = "Reviewed manifest identifier",
                    Value = "Reviewed manifest identifier was not stored."
                });

        return rows;
    }

    private static List<string> BuildRecommendedActions(ArchitectureAnalysisReport report, ArchitectureRunDetail detail)
    {
        List<string> actions = [];
        GoldenManifest? m = detail.Manifest;

        foreach (string constraint in m?.Governance.PolicyConstraints ?? [])
        {
            if (string.IsNullOrWhiteSpace(constraint))
                continue;

            actions.Add($"Recorded constraint: {constraint.Trim()}. No remediation action was stored.");

            if (actions.Count >= 8)
                break;
        }

        foreach (string w in report.Warnings ?? [])
        {
            if (string.IsNullOrWhiteSpace(w))
                continue;

            actions.Add($"Recommended action was not stored. Stored warning: {w.Trim()}");

            if (actions.Count >= 15)
                break;
        }

        return actions;
    }
}
