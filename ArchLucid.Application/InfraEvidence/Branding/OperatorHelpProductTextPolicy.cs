namespace ArchLucid.Application.InfraEvidence.Branding;

/// <summary>
///     Product help, legal, and version strings keep product identity even when tenant visual branding is Active.
/// </summary>
public static class OperatorHelpProductTextPolicy
{
    public const string ArchitectureProductNameToken = "ArchLucid";

    /// <summary>Legacy alias for architecture-line help identity checks.</summary>
    public const string RequiredProductNameToken = ArchitectureProductNameToken;

    public const string SecurityProductNameToken = "SecureNow";

    public const string PoweredByLabel = "Powered by ArchLucid";

    /// <summary>Representative operator-help footer copy; tenant branding must not strip product attribution from help text.</summary>
    public const string SampleHelpMarkdown =
        """
        # Getting started

        Use ArchLucid to create and review architecture packages with evidence-linked findings.

        For support, contact your workspace administrator or visit the ArchLucid trust center.
        """;

    public const string SampleSecurityHelpMarkdown =
        """
        # Getting started

        Use SecureNow to triage alerts and route incidents with evidence-linked context.

        SecureNow is the Security product from ArchLucid. For support, contact security@archlucid.net.
        """;

    public static bool RetainsProductIdentity(string? markdown, string requiredProductNameToken) =>
        !string.IsNullOrWhiteSpace(markdown)
        && markdown.Contains(requiredProductNameToken, StringComparison.Ordinal);

    public static bool RetainsProductIdentity(string? markdown) =>
        RetainsProductIdentity(markdown, RequiredProductNameToken);
}
