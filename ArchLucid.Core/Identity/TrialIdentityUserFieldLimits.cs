namespace ArchLucid.Core.Identity;

/// <summary>SQL column limits for <c>dbo.IdentityUsers</c> trial identity fields.</summary>
public static class TrialIdentityUserFieldLimits
{
    public const int NormalizedEmailMaxLength = 256;

    public const int LinkedEntraOidMaxLength = 128;
}
