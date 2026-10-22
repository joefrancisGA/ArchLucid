namespace ArchLucid.Cli.Commands;

internal sealed partial class FrontierAiBaselineRunner
{
    private static FrontierAiBaselineVerdict DeriveOverallVerdict(IReadOnlyList<FrontierAiBaselineCheckResult> checks)
    {
        if (checks.Any(static check => check.Verdict == FrontierAiBaselineVerdict.Fail))
            return FrontierAiBaselineVerdict.Fail;

        if (checks.Any(static check => check.Verdict == FrontierAiBaselineVerdict.Warn))
            return FrontierAiBaselineVerdict.Warn;

        return FrontierAiBaselineVerdict.Pass;
    }
}
