using System.Globalization;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Findings;

/// <summary>
///     AS-065: optional PilotStrict finalize hold for Unsupported decision-grade semantic support bands (TB-1228 opt-in).
/// </summary>
public static class UnsupportedSemanticSupportFinalizeHoldEvaluator
{
    public const string BlockingReasonPrefix =
        "Commit blocked: decision-grade finding(s) have Unsupported semantic support under PilotStrict hold (TB-1228 opt-in).";

    public static bool Applies(StructuralExecutionMode structuralExecutionMode, AgentOutputQualityGateOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (!options.PilotStrictHoldOnUnsupportedSemanticSupport)
        {
            return false;
        }

        if (!options.Enabled || options.Mode != AgentOutputQualityGateMode.PilotStrict)
        {
            return false;
        }

        return structuralExecutionMode == StructuralExecutionMode.Real;
    }

    public static bool Applies(ArchitectureRun run, AgentOutputQualityGateOptions options)
    {
        ArgumentNullException.ThrowIfNull(run);

        return Applies(run.StructuralExecutionMode, options);
    }

    public static int CountUnsupportedDecisionGradeFindings(IEnumerable<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        int count = 0;

        foreach (Finding finding in findings)
        {
            if (!DecisionGradeFindingExportFilter.IsDecisionGradeForExport(finding))
            {
                continue;
            }

            if (finding.SemanticSupportBand == FindingSemanticSupportBand.Unsupported)
            {
                count++;
            }
        }

        return count;
    }

    public static IReadOnlyList<string> GetBlockingReasons(
        ArchitectureRun run,
        AgentOutputQualityGateOptions options,
        IEnumerable<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(findings);

        if (!Applies(run, options))
        {
            return [];
        }

        int unsupportedCount = CountUnsupportedDecisionGradeFindings(findings);

        if (unsupportedCount == 0)
        {
            return [];
        }

        return
        [
            $"{BlockingReasonPrefix} Count: {unsupportedCount.ToString(CultureInfo.InvariantCulture)}.",
        ];
    }
}
