using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Core.QualityGates;

/// <summary>
///     Deterministic content hash for threshold-affecting <see cref="AgentOutputQualityGateOptions" /> (TB-972).
/// </summary>
public static class QualityGateDefinitionFingerprint
{
    public const string AlgorithmVersion = "v1";

    /// <summary>Computes lowercase hex SHA-256 over canonical threshold fields.</summary>
    public static string ComputeFromOptions(AgentOutputQualityGateOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        string canonical = BuildCanonicalPayload(options);
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(canonical));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    internal static string BuildCanonicalPayload(AgentOutputQualityGateOptions options)
    {
        StringBuilder builder = new();
        builder.Append(AlgorithmVersion).Append('\n');
        AppendLine(builder, "enabled", options.Enabled);
        AppendLine(builder, "mode", options.Mode);
        AppendLine(builder, "heuristicEvaluatorTightenedThresholds", options.HeuristicEvaluatorTightenedThresholds);
        AppendLine(builder, "structuralWarnBelow", options.StructuralWarnBelow);
        AppendLine(builder, "structuralRejectBelow", options.StructuralRejectBelow);
        AppendLine(builder, "semanticWarnBelow", options.SemanticWarnBelow);
        AppendLine(builder, "semanticRejectBelow", options.SemanticRejectBelow);
        AppendLine(builder, "pilotStrictMinStructuralCompleteness", options.PilotStrictMinStructuralCompleteness);
        AppendLine(builder, "pilotStrictMinSemanticScore", options.PilotStrictMinSemanticScore);
        AppendLine(builder, "pilotStrictMinEvidenceRefCount", options.PilotStrictMinEvidenceRefCount);
        AppendNullableDouble(builder, "pilotStrictMinFaithfulnessSupportRatio", options.PilotStrictMinFaithfulnessSupportRatio);
        AppendNullableDouble(builder, "pilotStrictMinAgentResultFaithfulnessSupportRatio", options.PilotStrictMinAgentResultFaithfulnessSupportRatio);
        AppendNullableDouble(builder, "pilotStrictMinCitationCoverageRatio", options.PilotStrictMinCitationCoverageRatio);

        foreach (KeyValuePair<string, AgentTypeQualityFloors> entry in options.PerAgentTypeFloors.OrderBy(static pair => pair.Key, StringComparer.OrdinalIgnoreCase))
        {
            AgentTypeQualityFloors floors = entry.Value;
            string prefix = $"perAgent.{entry.Key}.";

            AppendNullableDouble(builder, prefix + "structuralWarnBelow", floors.StructuralWarnBelow);
            AppendNullableDouble(builder, prefix + "structuralRejectBelow", floors.StructuralRejectBelow);
            AppendNullableDouble(builder, prefix + "semanticWarnBelow", floors.SemanticWarnBelow);
            AppendNullableDouble(builder, prefix + "semanticRejectBelow", floors.SemanticRejectBelow);
        }

        return builder.ToString();
    }

    private static void AppendLine(StringBuilder builder, string key, bool value)
    {
        builder.Append(key).Append('=').Append(value ? "true" : "false").Append('\n');
    }

    private static void AppendLine(StringBuilder builder, string key, AgentOutputQualityGateMode value)
    {
        builder.Append(key).Append('=').Append(value).Append('\n');
    }

    private static void AppendLine(StringBuilder builder, string key, int value)
    {
        builder.Append(key).Append('=').Append(value.ToString(CultureInfo.InvariantCulture)).Append('\n');
    }

    private static void AppendLine(StringBuilder builder, string key, double value)
    {
        builder.Append(key).Append('=').Append(value.ToString("G17", CultureInfo.InvariantCulture)).Append('\n');
    }

    private static void AppendNullableDouble(StringBuilder builder, string key, double? value)
    {
        if (!value.HasValue)
            return;

        AppendLine(builder, key, value.Value);
    }
}
