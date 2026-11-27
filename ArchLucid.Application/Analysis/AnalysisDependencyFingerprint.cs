using System.Security.Cryptography;
using System.Text.Json;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

namespace ArchLucid.Application.Analysis;

/// <summary>Exact input identity, not semantic equivalence. Ordered input positions form a versioned contract.</summary>
internal static class AnalysisDependencyFingerprint
{
    public static string Create(ProjectScopeKey scope, string stage, params object?[] inputs) =>
        Digest(new { Protocol = "analysis-dependency-v2", scope.TenantId, scope.WorkspaceId, scope.ProjectId, Stage = stage, Inputs = inputs });

    public static string Digest<T>(T value) =>
        Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(value)));

    public static string? Rejection(AnalysisRecoveryClaim? claim, string inputVersion, bool outputPresent, bool complete)
    {
        if (claim?.State != "succeeded")
            return "checkpoint_not_successful";

        if (!string.Equals(claim.InputVersion, inputVersion, StringComparison.Ordinal))
            return "stale_dependencies";

        if (!outputPresent || string.IsNullOrWhiteSpace(claim.ResultReference))
            return "output_missing";

        return complete ? null : "incomplete_dependency";
    }
}
