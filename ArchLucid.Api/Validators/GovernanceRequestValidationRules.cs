namespace ArchLucid.Api.Validators;

/// <summary>Shared HTTP validation limits for governance routes (manifest labels, review comments).</summary>
public static class GovernanceRequestValidationRules
{
    public const int ManifestVersionMaxLength = 128;

    public const int RunIdMaxLength = 64;

    public const int ReviewCommentMaxLength = 4000;

    public const int FindingIdMaxLength = 64;

    /// <summary>Matches <c>dbo.GovernanceApprovalRequests.ApprovalRequestId</c> primary key.</summary>
    public const int ApprovalRequestIdMaxLength = 64;

    /// <summary>Matches <c>dbo.GoldenManifestDecisions.Category</c> column width.</summary>
    public const int DecisionRegisterCategoryMaxLength = 200;
}
