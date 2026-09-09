namespace ArchLucid.Application.Operator;

/// <summary>
///     Working operator deep links that prefer nested architecture locators (ADR 0077 / AO-10).
///     Unlinked reviews keep the legacy peer review path.
/// </summary>
public static class WorkingOperatorReviewLinks
{
    public static string BuildReviewWorkspaceRelativePath(string runId, Guid? architectureId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        string trimmedRunId = runId.Trim();

        if (architectureId is Guid linkedArchitectureId && linkedArchitectureId != Guid.Empty)
        {
            return
                $"/architecture/architectures/{linkedArchitectureId:D}/reviews/{trimmedRunId}";
        }

        return $"/architecture/reviews/{trimmedRunId}";
    }

    public static string BuildReviewWorkspaceUrl(string? operatorBaseUrl, string runId, Guid? architectureId)
    {
        string relativePath = BuildReviewWorkspaceRelativePath(runId, architectureId);

        if (string.IsNullOrWhiteSpace(operatorBaseUrl))
        {
            return relativePath;
        }

        return $"{operatorBaseUrl.Trim().TrimEnd('/')}{relativePath}";
    }
}
