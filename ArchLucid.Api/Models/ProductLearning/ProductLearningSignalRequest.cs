using System.ComponentModel.DataAnnotations;

namespace ArchLucid.Api.Models.ProductLearning;

/// <summary>Human judgment captured from a pilot-facing review output.</summary>
public sealed class ProductLearningSignalRequest
{
    public string? ArchitectureRunId { get; init; }
    public Guid? AuthorityRunId { get; init; }
    public string? ManifestVersion { get; init; }

    [Required]
    [MaxLength(64)]
    public string SubjectType { get; init; } = string.Empty;

    [Required]
    [MaxLength(32)]
    public string Disposition { get; init; } = string.Empty;

    [MaxLength(200)]
    public string? PatternKey { get; init; }

    [MaxLength(512)]
    public string? ArtifactHint { get; init; }

    [MaxLength(2000)]
    public string? CommentShort { get; init; }

    public string? DetailJson { get; init; }
}
