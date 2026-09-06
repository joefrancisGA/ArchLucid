namespace ArchLucid.Application.InfraEvidence.Branding;

/// <summary>
///     Product help, legal, and version strings keep ArchLucid identity even when tenant visual branding is Active.
/// </summary>
public static class OperatorHelpProductTextPolicy
{
    public const string RequiredProductNameToken = "ArchLucid";

    public const string PoweredByLabel = "Powered by ArchLucid";

    /// <summary>Representative operator-help footer copy; tenant branding must not strip product attribution from help text.</summary>
    public const string SampleHelpMarkdown =
        """
        # Getting started

        Use ArchLucid to create and review architecture packages with evidence-linked findings.

        For support, contact your workspace administrator or visit the ArchLucid trust center.
        """;

    public static bool RetainsProductIdentity(string? markdown) =>
        !string.IsNullOrWhiteSpace(markdown)
        && markdown.Contains(RequiredProductNameToken, StringComparison.Ordinal);
}
