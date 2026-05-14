namespace ArchLucid.Application.Analysis;

/// <summary>
///     Creates a GitHub Pull Request containing advisory Terraform files for the given run.
/// </summary>
public interface ITerraformGitHubPrService
{
    /// <summary>
    ///     Creates a branch <c>archlucid/terraform-update-{runId}</c> on the configured GitHub repository,
    ///     commits the advisory Terraform ZIP contents as individual files, and opens a Pull Request
    ///     against the configured base branch.
    /// </summary>
    Task<TerraformPrCreationResult> CreatePrAsync(
        Guid runId,
        byte[] terraformZipContent,
        CancellationToken cancellationToken = default);
}
