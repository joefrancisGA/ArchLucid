namespace ArchLucid.Application.Analysis;

/// <summary>
///     Configuration for creating Terraform advisory Pull Requests on GitHub.
///     Bind under <c>TerraformGitHubPr</c> in app settings; reference the PAT from Azure Key Vault.
/// </summary>
public sealed class TerraformGitHubPrOptions
{
    /// <summary>Configuration section path.</summary>
    public const string SectionPath = "TerraformGitHubPr";

    /// <summary>Whether the GitHub PR feature is enabled. Defaults to <c>false</c>.</summary>
    public bool Enabled { get; set; }

    /// <summary>GitHub repository owner (user or org). Example: <c>acmecorp</c>.</summary>
    public string? Owner { get; set; }

    /// <summary>GitHub repository name. Example: <c>infra-terraform</c>.</summary>
    public string? Repo { get; set; }

    /// <summary>
    ///     Base branch for the PR (default branch of the repo). Example: <c>main</c>.
    ///     Defaults to <c>main</c> when absent.
    /// </summary>
    public string BaseBranch { get; set; } = "main";

    /// <summary>
    ///     GitHub Personal Access Token (PAT) with <c>repo</c> scope, or a GitHub App installation token.
    ///     Use a Key Vault reference rather than a plaintext value in production.
    ///     Never logged.
    /// </summary>
    public string? PersonalAccessToken { get; set; }
}
