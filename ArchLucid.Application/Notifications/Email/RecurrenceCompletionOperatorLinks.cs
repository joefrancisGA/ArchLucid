namespace ArchLucid.Application.Notifications.Email;

/// <summary>
///     Operator-shell deep links for recurrence completion email (TB-2194 lifecycle anchor on compare-two-reviews).
/// </summary>
public static class RecurrenceCompletionOperatorLinks
{
    public const string FindingLifecycleCompareAnchor = "compare-finding-lifecycle";

    public static string BuildCompareUrl(string? operatorBaseUrl, Guid sourceRunId, Guid triggeredRunId)
    {
        string priorRunId = sourceRunId.ToString("N");
        string laterRunId = triggeredRunId.ToString("N");
        string relativePath =
            $"/insights/compare-two-reviews?priorRunId={priorRunId}&laterRunId={laterRunId}#{FindingLifecycleCompareAnchor}";

        if (string.IsNullOrWhiteSpace(operatorBaseUrl))
            return relativePath;

        return $"{operatorBaseUrl.TrimEnd('/')}{relativePath}";
    }
}
