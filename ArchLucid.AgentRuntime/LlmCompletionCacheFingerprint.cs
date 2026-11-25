using System.Globalization;
using System.Security.Cryptography;
using System.Text.Json;

using ArchLucid.Core.Scoping;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     SHA-256 fingerprints for LLM completion cache partitioning.
/// </summary>
public static class LlmCompletionCacheFingerprint
{
    /// <summary>
    ///     SHA-256 hex digest over deployment name, prompts, and optional scope partition (legacy completion store key).
    /// </summary>
    public static string Compute(
        bool partitionByScope,
        string deploymentName,
        string systemPrompt,
        string userPrompt,
        ScopeContext scope)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(deploymentName);
        ArgumentNullException.ThrowIfNull(systemPrompt);
        ArgumentNullException.ThrowIfNull(userPrompt);
        ArgumentNullException.ThrowIfNull(scope);

        return ComputeFramedHash(
            "completion-v3",
            partitionByScope ? FormatScopePartition(scope) : string.Empty,
            deploymentName,
            systemPrompt,
            userPrompt);
    }

    /// <summary>
    ///     SHA-256 hex digest over separately framed system and user prompt segments.
    /// </summary>
    public static string ComputePromptHash(string systemPrompt, string userPrompt)
    {
        ArgumentNullException.ThrowIfNull(systemPrompt);
        ArgumentNullException.ThrowIfNull(userPrompt);

        return ComputeFramedHash("prompt-v3", systemPrompt, userPrompt);
    }

    /// <summary>Separates explicit generation overrides from defaults and from each other.</summary>
    internal static string WithGenerationOptions(string baseFingerprint, int? maxTokens, float? temperature)
    {
        if (maxTokens is null && temperature is null)
            return baseFingerprint;

        return ComputeFramedHash(
            "generation-options-v1",
            baseFingerprint,
            maxTokens?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
            temperature?.ToString("R", CultureInfo.InvariantCulture) ?? string.Empty);
    }

    private static string ComputeFramedHash(params string[] segments)
    {
        // Frame delimiters inside each segment and invalidate legacy ambiguous keys.
        byte[] payload = JsonSerializer.SerializeToUtf8Bytes(segments);

        return Convert.ToHexString(SHA256.HashData(payload));
    }

    /// <summary>
    ///     Stable scope suffix for cache keys when completion cache partitions by tenancy scope.
    /// </summary>
    public static string FormatScopePartition(ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{scope.TenantId:N}|{scope.WorkspaceId:N}|{scope.ProjectId:N}|";
    }
}
