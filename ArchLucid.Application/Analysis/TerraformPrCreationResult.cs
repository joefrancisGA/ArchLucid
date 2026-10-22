namespace ArchLucid.Application.Analysis;

/// <summary>Result of creating a Terraform advisory GitHub Pull Request.</summary>
public sealed class TerraformPrCreationResult
{
    /// <summary>GitHub Pull Request URL (e.g. <c>https://github.com/acme/infra/pull/42</c>).</summary>
    public string PullRequestUrl { get; init; } = string.Empty;

    /// <summary>Pull Request number on GitHub.</summary>
    public int PullRequestNumber { get; init; }

    /// <summary>Branch name created for this PR (e.g. <c>archlucid/terraform-update-{runId}</c>).</summary>
    public string BranchName { get; init; } = string.Empty;
}
