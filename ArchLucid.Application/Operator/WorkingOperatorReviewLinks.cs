namespace ArchLucid.Application.Operator;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

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

    public static string BuildFindingInspectRelativePath(string runId, string findingId, Guid? architectureId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(findingId);
        string trimmedRunId = runId.Trim();
        string encodedFindingId = Uri.EscapeDataString(findingId.Trim());
        string reviewPath = BuildReviewWorkspaceRelativePath(trimmedRunId, architectureId);

        return $"{reviewPath}/findings/{encodedFindingId}";
    }

    public static async Task<string> BuildReviewWorkspaceUrlForRunAsync(
        IRunRepository runRepository,
        ScopeContext scope,
        string? operatorBaseUrl,
        string runId,
        CancellationToken cancellationToken)
    {
        Guid? architectureId = await WorkingOperatorRunArchitectureIdResolver.TryResolveAsync(
            runRepository,
            scope,
            runId,
            cancellationToken).ConfigureAwait(false);

        return BuildReviewWorkspaceUrl(operatorBaseUrl, runId, architectureId);
    }
}
