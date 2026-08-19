namespace ArchLucid.Core.Support;

/// <summary>
///     Stable relative paths (from repository root) cited in support bundles and CLI hints so operators
///     can open the same files in checkout or published doc mirrors.
/// </summary>
public static class SupportBundleDocLinks
{
    /// <summary>
    ///     V1 symptom-first triage for pilots (first-pilot troubleshooting decision tree).
    ///     Linked from <c>references.json</c> and <c>doctor</c> output.
    ///     Constant name retained for CLI/support-bundle call-site stability after the rescue playbook merge.
    /// </summary>
    public const string PilotRescuePlaybookRelativePath = "docs/runbooks/FIRST_PILOT_TROUBLESHOOTING.md";

    /// <summary>Report problem intake triage for support inbox notifications; linked from <c>references.json</c>.</summary>
    public const string SupportProblemReportTriageRelativePath = "docs/runbooks/SUPPORT_PROBLEM_REPORT_TRIAGE.md";
}
