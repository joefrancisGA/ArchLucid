using System.ComponentModel.DataAnnotations;

namespace ArchLucid.Contracts.Requests;

/// <summary>
///     Inbound connector intake: Terraform state JSON or a public Git repository Terraform file.
/// </summary>
public sealed class ConnectorIntakeRequest
{
    /// <summary><c>terraform-show-json</c> or <c>git-terraform</c>.</summary>
    [Required]
    [MaxLength(40)]
    public string Source
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Full <c>terraform show -json</c> body when <see cref="Source" /> is <c>terraform-show-json</c>.</summary>
    [MaxLength(5_000_000)]
    public string? TerraformShowJson
    {
        get;
        set;
    }

    /// <summary>Public Git repository URL when <see cref="Source" /> is <c>git-terraform</c>.</summary>
    [MaxLength(500)]
    public string? GitRepositoryUrl
    {
        get;
        set;
    }

    /// <summary>Branch or tag (defaults to <c>main</c>).</summary>
    [MaxLength(100)]
    public string? GitBranch
    {
        get;
        set;
    }

    /// <summary>Path to a <c>.tf</c> file inside the repository.</summary>
    [MaxLength(500)]
    public string? GitTerraformPath
    {
        get;
        set;
    }

    [MaxLength(200)]
    public string? SystemName
    {
        get;
        set;
    }

    [MaxLength(ArchitectureRequestFieldLimits.MaxDescriptionLength)]
    public string? Description
    {
        get;
        set;
    }
}
