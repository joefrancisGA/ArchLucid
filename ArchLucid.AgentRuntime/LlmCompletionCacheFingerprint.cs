using System.Security.Cryptography;
using System.Text;

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

        string scopePart = string.Empty;

        if (partitionByScope)

            scopePart =
                $"{scope.TenantId:N}|{scope.WorkspaceId:N}|{scope.ProjectId:N}|";


        string payload =
            scopePart
            + deploymentName
            + '\0'
            + systemPrompt
            + '\0'
            + userPrompt;

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));

        return Convert.ToHexString(hash);
    }

    /// <summary>
    ///     SHA-256 hex digest over the full prompt text (system and user segments, separated by U+0000).
    /// </summary>
    public static string ComputePromptHash(string systemPrompt, string userPrompt)
    {
        ArgumentNullException.ThrowIfNull(systemPrompt);
        ArgumentNullException.ThrowIfNull(userPrompt);

        string payload = systemPrompt + '\0' + userPrompt;
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));

        return Convert.ToHexString(hash);
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
