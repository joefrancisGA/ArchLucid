using System.Net;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Extracts webhook hostnames without persisting callback paths or tokens (AX-DE-11).
/// </summary>
public static class AzureInventoryEventGridWebhookHostExtractor
{
    private const int MaxEndpointUrlPercentDecodePasses = 8;

    public static string? TryExtractHost(string? endpointUrl)
    {
        if (string.IsNullOrWhiteSpace(endpointUrl))
        {
            return null;
        }

        string trimmed = endpointUrl.Trim();

        for (int pass = 0; pass < MaxEndpointUrlPercentDecodePasses && trimmed.Contains('%', StringComparison.Ordinal); pass++)
        {
            string decoded = Uri.UnescapeDataString(trimmed);

            if (string.Equals(decoded, trimmed, StringComparison.Ordinal))
            {
                break;
            }

            trimmed = decoded;
        }

        trimmed = TrimTrailingDotBeforePortInAbsoluteAuthority(trimmed);
        trimmed = TrimTrailingDotFromSchemeLessAuthority(trimmed);
        trimmed = TryBracketUnbracketedIpv6Authority(trimmed);

        Uri? uri = null;

        if (Uri.TryCreate(trimmed, UriKind.Absolute, out Uri? absoluteUri)
            && !string.IsNullOrWhiteSpace(absoluteUri.Host))
        {
            uri = absoluteUri;
        }
        else if (!trimmed.Contains("://", StringComparison.Ordinal)
                 && (trimmed.Contains('.', StringComparison.Ordinal)
                     || trimmed.StartsWith("[", StringComparison.Ordinal))
                 && Uri.TryCreate("https://" + trimmed, UriKind.Absolute, out absoluteUri))
        {
            uri = absoluteUri;
        }

        if (uri is null)
        {
            return null;
        }

        string host = uri.Host.Trim().ToLowerInvariant();

        if (host.Length >= 2 && host[0] == '[' && host[^1] == ']')
        {
            host = host[1..^1];
        }

        if (host.Length > 0 && host[^1] == '.')
        {
            host = host.TrimEnd('.');
        }

        if (string.IsNullOrWhiteSpace(host))
        {
            return null;
        }

        return host;
    }

    private static string TrimTrailingDotBeforePortInAbsoluteAuthority(string trimmed)
    {
        int schemeSeparator = trimmed.IndexOf("://", StringComparison.Ordinal);

        if (schemeSeparator < 0)
        {
            return trimmed;
        }

        int authorityStart = schemeSeparator + 3;
        int pathIndex = trimmed.IndexOf('/', authorityStart);
        int authorityEnd = pathIndex >= 0 ? pathIndex : trimmed.Length;
        string authority = trimmed[authorityStart..authorityEnd];
        int portSeparator = authority.LastIndexOf(':');

        if (portSeparator <= 0 || authority[portSeparator - 1] != '.')
        {
            return trimmed;
        }

        string fixedAuthority = authority.Remove(portSeparator - 1, 1);

        return trimmed[..authorityStart] + fixedAuthority + trimmed[authorityEnd..];
    }

    private static string TrimTrailingDotFromSchemeLessAuthority(string trimmed)
    {
        if (trimmed.Contains("://", StringComparison.Ordinal))
        {
            return trimmed;
        }

        int pathIndex = trimmed.IndexOf('/');
        if (pathIndex <= 0)
        {
            return trimmed.TrimEnd('.');
        }

        string authority = trimmed[..pathIndex].TrimEnd('.');

        return authority + trimmed[pathIndex..];
    }

    private static string TryBracketUnbracketedIpv6Authority(string trimmed)
    {
        if (trimmed.Contains("://", StringComparison.Ordinal)
            || trimmed.StartsWith("[", StringComparison.Ordinal)
            || trimmed.Contains('.', StringComparison.Ordinal)
            || !trimmed.Contains("::", StringComparison.Ordinal))
        {
            return trimmed;
        }

        int pathIndex = trimmed.IndexOf('/');
        string authority = pathIndex >= 0 ? trimmed[..pathIndex] : trimmed;
        string pathSuffix = pathIndex >= 0 ? trimmed[pathIndex..] : string.Empty;

        if (TrySplitTrailingNumericPort(authority, out string hostAuthority, out string? portSuffix))
        {
            return $"[{hostAuthority}]{portSuffix}{pathSuffix}";
        }

        return $"[{authority}]{pathSuffix}";
    }

    private static bool TrySplitTrailingNumericPort(string authority, out string hostAuthority, out string? portSuffix)
    {
        hostAuthority = authority;
        portSuffix = null;

        int portSeparator = authority.LastIndexOf(':');
        if (portSeparator <= 0)
        {
            return false;
        }

        string portDigits = authority[(portSeparator + 1)..];
        if (portDigits.Length == 0 || !portDigits.All(static c => char.IsAsciiDigit(c)))
        {
            return false;
        }

        string candidateHost = authority[..portSeparator];
        if (!candidateHost.Contains("::", StringComparison.Ordinal)
            || !IPAddress.TryParse(candidateHost, out _))
        {
            return false;
        }

        hostAuthority = candidateHost;
        portSuffix = ":" + portDigits;
        return true;
    }
}
