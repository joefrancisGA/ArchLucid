using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Analysis;

public static partial class DeclarationSecurityBaselineClassifier
{
    private static bool IsUnsafePublicNetworkAccess(IReadOnlyDictionary<string, string> properties)
    {
        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
                out _,
                out string? publicNetworkAccess)
            && IsEnabledToken(publicNetworkAccess))
            return true;

        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.AllowBlobPublicAccess,
                out _,
                out string? blobPublicAccess)
            && IsTruthy(blobPublicAccess))
            return true;

        return false;
    }

    private static bool HasOpenAdminIngressHeuristic(IReadOnlyDictionary<string, string> properties)
    {
        if (!DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.IngressBlob,
                out _,
                out string? ingressBlob)
            || string.IsNullOrWhiteSpace(ingressBlob))
            return false;

        string normalized = ingressBlob.ToLowerInvariant();

        if (!normalized.Contains("0.0.0.0/0", StringComparison.Ordinal))
            return false;

        return ContainsIsolatedPort(normalized, 22)
            || ContainsIsolatedPort(normalized, 3389);
    }

    private static bool ContainsIsolatedPort(string normalized, int port)
    {
        string portText = port.ToString();

        for (int index = 0; index <= normalized.Length - portText.Length; index++)
        {
            if (!normalized.AsSpan(index, portText.Length).SequenceEqual(portText))
                continue;

            bool beforeIsDigit = index > 0 && char.IsDigit(normalized[index - 1]);
            int afterIndex = index + portText.Length;

            if (beforeIsDigit)
                continue;

            if (afterIndex < normalized.Length && char.IsDigit(normalized[afterIndex]))
                continue;

            return true;
        }

        return false;
    }
}
