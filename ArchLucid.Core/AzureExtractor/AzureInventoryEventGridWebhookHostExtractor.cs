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
        trimmed = TryBracketUnbracketedIpv6InAbsoluteAuthority(trimmed);
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

    private static string TryBracketUnbracketedIpv6InAbsoluteAuthority(string trimmed)
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

        if (authority.StartsWith("[", StringComparison.Ordinal)
            || !authority.Contains("::", StringComparison.Ordinal))
        {
            return trimmed;
        }

        authority = TrimTrailingDotBeforePortInAuthoritySegment(authority).TrimEnd('.');

        if (TrySplitTrailingNumericPort(authority, out string hostAuthority, out string? portSuffix))
        {
            authority = $"[{hostAuthority}]{portSuffix}";
        }
        else
        {
            authority = $"[{authority}]";
        }

        return trimmed[..authorityStart] + authority + trimmed[authorityEnd..];
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
        string authority = TrimTrailingDotBeforePortInAuthoritySegment(trimmed[authorityStart..authorityEnd]);

        if (string.Equals(authority, trimmed[authorityStart..authorityEnd], StringComparison.Ordinal))
        {
            return trimmed;
        }

        return trimmed[..authorityStart] + authority + trimmed[authorityEnd..];
    }

    private static string TrimTrailingDotFromSchemeLessAuthority(string trimmed)
    {
        if (trimmed.Contains("://", StringComparison.Ordinal))
        {
            return trimmed;
        }

        int pathIndex = trimmed.IndexOf('/');
        string authority = pathIndex > 0 ? trimmed[..pathIndex] : trimmed;
        string pathSuffix = pathIndex > 0 ? trimmed[pathIndex..] : string.Empty;

        authority = TrimTrailingDotBeforePortInAuthoritySegment(authority).TrimEnd('.');

        return authority + pathSuffix;
    }

    private static string TrimTrailingDotBeforePortInAuthoritySegment(string authority)
    {
        int portSeparator = authority.LastIndexOf(':');

        if (portSeparator <= 0 || authority[portSeparator - 1] != '.')
        {
            return authority;
        }

        return authority.Remove(portSeparator - 1, 1);
    }

    private static string TryBracketUnbracketedIpv6Authority(string trimmed)
    {
        if (trimmed.Contains("://", StringComparison.Ordinal)
            || trimmed.StartsWith("[", StringComparison.Ordinal)
            || !trimmed.Contains("::", StringComparison.Ordinal))
        {
            return trimmed;
        }

        if (trimmed.Contains('.', StringComparison.Ordinal)
            && !trimmed.Contains("::", StringComparison.Ordinal))
        {
            return trimmed;
        }

        int pathIndex = trimmed.IndexOf('/');
        string authority = pathIndex >= 0 ? trimmed[..pathIndex] : trimmed;
        string pathSuffix = pathIndex >= 0 ? trimmed[pathIndex..] : string.Empty;

        authority = TrimTrailingDotBeforePortInAuthoritySegment(authority).TrimEnd('.');

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
