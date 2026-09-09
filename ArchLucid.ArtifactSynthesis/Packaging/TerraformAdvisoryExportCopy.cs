namespace ArchLucid.ArtifactSynthesis.Packaging;

/// <summary>
///     Canonical copy for Terraform advisory exports.
/// </summary>
public static class TerraformAdvisoryExportCopy
{
    /// <summary>
    ///     Full <c>ADVISORY.md</c> body for Terraform ZIP exports (server placeholder and any path that embeds this file).
    /// </summary>
    public const string AdvisoryMarkdownBody =
        """
        # Advisory

        ArchLucid never applies or destroys resources. This Terraform export is strictly advisory—review and run
        `terraform plan` (and any apply) only under your own change control. ArchLucid does not execute
        `terraform apply`, `terraform destroy`, or equivalent on your infrastructure.
        """;
}
