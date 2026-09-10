using ArchLucid.Decisioning.Analysis;
using ArchLucid.Core.Findings;

namespace ArchLucid.Application.Findings.PortfolioSharedTopology;

/// <summary>Derives a closed posture code from declaration node property bags (DX-53).</summary>
public static class SharedResourcePostureCode
{
    public static bool TryDerive(IReadOnlyDictionary<string, string> properties, out string postureCode)
    {
        ArgumentNullException.ThrowIfNull(properties);

        List<string> segments = [];

        if (TryDerivePublicNetworkAccess(properties, out string publicNetworkAccess))
        {
            segments.Add($"PublicNetworkAccess={publicNetworkAccess}");
        }

        if (TryDeriveReplicaPresence(properties, out string replicaPresence))
        {
            segments.Add($"Replica={replicaPresence}");
        }

        if (segments.Count == 0)
        {
            postureCode = string.Empty;

            return false;
        }

        postureCode = string.Join(';', segments);

        return true;
    }

    public static string? TryGetFirstDisagreementLabel(string thisPostureCode, string otherPostureCode)
    {
        Dictionary<string, string> thisSegments = ParseSegments(thisPostureCode);
        Dictionary<string, string> otherSegments = ParseSegments(otherPostureCode);

        foreach (KeyValuePair<string, string> segment in thisSegments)
        {
            if (!otherSegments.TryGetValue(segment.Key, out string? otherValue))
            {
                continue;
            }

            if (!string.Equals(segment.Value, otherValue, StringComparison.Ordinal))
            {
                return segment.Key;
            }
        }

        return null;
    }

    private static bool TryDerivePublicNetworkAccess(IReadOnlyDictionary<string, string> properties, out string normalized)
    {
        normalized = string.Empty;

        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
                out _,
                out string? publicNetworkAccess)
            && TryNormalizePublicNetworkAccess(publicNetworkAccess, out normalized))
        {
            return true;
        }

        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.AllowBlobPublicAccess,
                out _,
                out string? blobPublicAccess)
            && TryNormalizeBlobPublicAccess(blobPublicAccess, out normalized))
        {
            return true;
        }

        return false;
    }

    private static bool TryDeriveReplicaPresence(IReadOnlyDictionary<string, string> properties, out string normalized)
    {
        normalized = DrReplicaPropertyHeuristic.HasReplicaEvidence(properties) ? "present" : "none";

        return true;
    }

    private static bool TryNormalizePublicNetworkAccess(string? value, out string normalized)
    {
        normalized = string.Empty;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        if (string.Equals(value, "enabled", StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, "true", StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, "allow", StringComparison.OrdinalIgnoreCase))
        {
            normalized = "public";

            return true;
        }

        if (string.Equals(value, "disabled", StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, "false", StringComparison.OrdinalIgnoreCase))
        {
            normalized = "private";

            return true;
        }

        return false;
    }

    private static bool TryNormalizeBlobPublicAccess(string? value, out string normalized)
    {
        normalized = string.Empty;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        if (string.Equals(value, "true", StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, "allow", StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, "enabled", StringComparison.OrdinalIgnoreCase))
        {
            normalized = "public";

            return true;
        }

        if (string.Equals(value, "false", StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, "disabled", StringComparison.OrdinalIgnoreCase))
        {
            normalized = "private";

            return true;
        }

        return false;
    }

    private static Dictionary<string, string> ParseSegments(string postureCode)
    {
        Dictionary<string, string> segments = new(StringComparer.Ordinal);

        foreach (string rawSegment in postureCode.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            int separatorIndex = rawSegment.IndexOf('=');

            if (separatorIndex <= 0 || separatorIndex >= rawSegment.Length - 1)
            {
                continue;
            }

            string key = rawSegment[..separatorIndex];
            string value = rawSegment[(separatorIndex + 1)..];
            segments[key] = value;
        }

        return segments;
    }
}
