namespace ArchLucid.Api.Controllers.Authority;

/// <summary>Response body for <c>POST /v1/artifacts/runs/{runId}/terraform-pr</c>.</summary>
public sealed class TerraformPrCreatedResponse
{
    /// <summary>Full GitHub Pull Request URL (e.g. <c>https://github.com/acme/infra/pull/42</c>).</summary>
    public string PullRequestUrl { get; init; } = string.Empty;

    /// <summary>GitHub Pull Request number.</summary>
    public int PullRequestNumber { get; init; }

    /// <summary>Branch created for the PR (e.g. <c>archlucid/terraform-update-{runId}</c>).</summary>
    public string BranchName { get; init; } = string.Empty;
}
