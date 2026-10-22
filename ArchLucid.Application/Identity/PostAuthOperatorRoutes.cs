namespace ArchLucid.Application.Identity;

/// <summary>
/// Canonical operator UI paths returned after post-auth bootstrap (invitation accept, workspace create).
/// Must stay aligned with <c>archlucid-ui/src/lib/first-review-guide-route.ts</c>.
/// </summary>
public static class PostAuthOperatorRoutes
{
    public const string FirstReviewGuidePath = "/architecture/first-review-guide";

    public const string InvitationAcceptedPath = FirstReviewGuidePath + "?source=invitation";

    public const string BootstrapCompletePath = FirstReviewGuidePath + "?source=bootstrap";

    public static string BuildBootstrapCompletePath(string? industryVertical)
    {
        if (string.IsNullOrWhiteSpace(industryVertical))
        {
            return BootstrapCompletePath;
        }

        return $"{FirstReviewGuidePath}?source=bootstrap&industry={Uri.EscapeDataString(industryVertical.Trim())}";
    }
}
