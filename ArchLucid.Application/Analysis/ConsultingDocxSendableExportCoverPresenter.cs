using ArchLucid.Application.Exports;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Analysis;

internal static class ConsultingDocxSendableExportCoverPresenter
{
    public static IReadOnlyList<string> RenderPlainTextLines(CareerExportCoverageHonestyInput input)
    {
        ArgumentNullException.ThrowIfNull(input);

        List<string> lines = [];

        if (!string.IsNullOrWhiteSpace(input.RuleSetId) && !string.IsNullOrWhiteSpace(input.RuleSetVersion))
        {
            lines.Add($"Policy pack: {input.RuleSetId.Trim()} @ {input.RuleSetVersion.Trim()}");
        }

        FeasibilityVerdict? verdict = input.CoverageContext.Verdict;

        if (verdict is not null && DecisionReceiptComposer.IsExportableVerdict(verdict.Kind))
        {
            lines.Add(
                $"Gate outcome: {FormatVerdictKindLabel(verdict.Kind)} — treat exports as a reasoned decision record, not approval to proceed.");
        }

        lines.Add(
            $"Execution mode: {StructuralExecutionModeLabels.ToDisplayLabel(input.StructuralExecutionMode)}");

        return lines;
    }

    private static string FormatVerdictKindLabel(FeasibilityVerdictKind kind) =>
        kind switch
        {
            FeasibilityVerdictKind.SoftInfeasible => "Soft infeasible",
            FeasibilityVerdictKind.HardInfeasible => "Hard infeasible",
            _ => kind.ToString(),
        };
}
