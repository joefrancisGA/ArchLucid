using System.ComponentModel.DataAnnotations;

namespace ArchLucid.Contracts.Architecture;

/// <summary>Minimal input for a single-pass architecture quick scan (no full wizard).</summary>
public sealed class ArchitectureQuickScanRequest
{
    /// <summary>Human-readable system or application name.</summary>
    [Required]
    public string SystemName { get; init; } = string.Empty;

    /// <summary>Controlled primary environment selection (see <see cref="QuickScanPrimaryEnvironment" />).</summary>
    [Required]
    public string PrimaryEnvironment { get; init; } = string.Empty;

    /// <summary>Optional detail when <see cref="PrimaryEnvironment" /> is <c>Other</c>.</summary>
    public string? PrimaryEnvironmentOther { get; init; }

    /// <summary>
    ///     Legacy alias for <see cref="PrimaryEnvironment" /> — accepted for backward compatibility only.
    /// </summary>
    public string? CloudProvider { get; init; }

    /// <summary>Free-text description of scope, constraints, or context.</summary>
    [Required]
    public string Description { get; init; } = string.Empty;

    /// <summary>Optional focus areas (max three validated values).</summary>
    public List<string> ArchitectureConcerns { get; init; } = [];

    /// <summary>Optional bot-challenge token when anonymous progressive CAPTCHA friction is enabled (TB-897).</summary>
    public string? BotChallengeToken { get; init; }
}
