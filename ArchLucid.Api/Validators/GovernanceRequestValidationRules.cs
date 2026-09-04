namespace ArchLucid.Api.Validators;

/// <summary>Shared HTTP validation limits for governance routes (manifest labels, review comments).</summary>
public static class GovernanceRequestValidationRules
{
    public const int ManifestVersionMaxLength = 128;

    public const int ReviewCommentMaxLength = 4000;

    public const int FindingIdMaxLength = 64;
}
