namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// Version pins included in <see cref="Contracts.ArchitectureIntelligence.ReviewCacheDependencyManifest"/>.
/// Bump when prompt, model routing, policy, or rubric logic changes so cached reviews invalidate.
/// </summary>
internal static class ArchitectureIntelligenceCacheVersions
{
    public const string PromptVersion = "ai-prompt-v1";

    public const string ModelVersion = "ai-model-v1";

    public const string PolicyPackVersion = "ai-policy-v1";

    public const string RubricVersion = "ai-rubric-v1";

    public const int SchemaVersion = 1;
}
