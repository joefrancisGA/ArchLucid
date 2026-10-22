namespace ArchLucid.Host.Core.ProblemDetails;

/// <summary>
///     Stable repo-relative documentation paths surfaced on <c>application/problem+json</c> (extensions), e.g. for operator CLIs
///     and UIs that display the problem payload.
/// </summary>
public static class ProblemDocumentationLinks
{
    /// <summary>Markdown runbook: quality gate rejection, HTTP 409, and remediation.</summary>
    public const string QualityGateRejectionRunbookRelativePath = "docs/runbooks/QUALITY_GATE_REJECTION.md";

    /// <summary>Extension member name on <see cref="Microsoft.AspNetCore.Mvc.ProblemDetails" /> for the runbook path.</summary>
    public const string RunbookExtensionKey = "runbook";
}
