using System.Text.RegularExpressions;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses non-SQL connection string shapes into hostnames only (DCH-02).
/// </summary>
public static partial class AzureInventoryAppSettingHostConnectionStringParser
{
    public static void AppendConnectionHosts(string value, List<AzureInventoryAppSettingHostParsedFields> results)
    {
        ArgumentNullException.ThrowIfNull(value);
        ArgumentNullException.ThrowIfNull(results);

        string trimmed = value.Trim();

        if (string.IsNullOrWhiteSpace(trimmed))
        {
            return;
        }

        AppendStorageHosts(trimmed, results);
        AppendServiceBusHost(trimmed, results);
        AppendCosmosHost(trimmed, results);
        AppendRedisHost(trimmed, results);
    }

    private static void AppendStorageHosts(string value, List<AzureInventoryAppSettingHostParsedFields> results)
    {
        Match accountMatch = StorageAccountNameRegex().Match(value);

        if (!accountMatch.Success)
        {
            return;
        }

        string accountName = accountMatch.Groups["name"].Value.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(accountName))
        {
            return;
        }

        if (!StorageAccountNameValueRegex().IsMatch(accountName))
        {
            return;
        }

        List<string> endpointHosts = [];

        foreach (string endpointKey in new[] { "QueueEndpoint", "TableEndpoint", "FileEndpoint", "BlobEndpoint" })
        {
            Match endpointMatch = StorageEndpointRegex(endpointKey).Match(value);

            if (!endpointMatch.Success)
            {
                continue;
            }

            string host = NormalizeStorageHost(endpointMatch.Groups["host"].Value);

            if (!string.IsNullOrWhiteSpace(host))
            {
                endpointHosts.Add(host);
            }
        }

        if (endpointHosts.Count > 0)
        {
            foreach (string host in endpointHosts.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                AddHostOnly(results, host);
            }

            return;
        }

        Match suffixMatch = StorageEndpointSuffixRegex().Match(value);

        if (!suffixMatch.Success)
        {
            return;
        }

        string suffix = NormalizeEndpointSuffix(suffixMatch.Groups["suffix"].Value);

        if (string.IsNullOrWhiteSpace(suffix))
        {
            return;
        }

        AddHostOnly(results, $"{accountName}.blob.{suffix}");
    }

    private static void AppendServiceBusHost(string value, List<AzureInventoryAppSettingHostParsedFields> results)
    {
        Match match = ServiceBusEndpointRegex().Match(value);

        if (!match.Success)
        {
            return;
        }

        string host = NormalizeServiceBusHost(match.Groups["host"].Value);

        if (!string.IsNullOrWhiteSpace(host))
        {
            AddHostOnly(results, host);
        }
    }

    private static void AppendCosmosHost(string value, List<AzureInventoryAppSettingHostParsedFields> results)
    {
        Match match = CosmosDocumentsHostRegex().Match(value);

        if (match.Success)
        {
            string host = NormalizeCosmosHost(match.Groups["host"].Value);

            if (!string.IsNullOrWhiteSpace(host))
            {
                AddHostOnly(results, host);
            }

            return;
        }

        Match accountEndpointMatch = CosmosAccountEndpointHostRegex().Match(value);

        if (!accountEndpointMatch.Success)
        {
            return;
        }

        string accountHost = NormalizeCosmosHost(accountEndpointMatch.Groups["host"].Value);

        if (!string.IsNullOrWhiteSpace(accountHost))
        {
            AddHostOnly(results, accountHost);
        }
    }

    private static void AppendRedisHost(string value, List<AzureInventoryAppSettingHostParsedFields> results)
    {
        Match match = RedisCacheHostRegex().Match(value);

        if (!match.Success)
        {
            return;
        }

        string host = NormalizeRedisHost(match.Groups["host"].Value);

        if (!string.IsNullOrWhiteSpace(host))
        {
            AddHostOnly(results, host);
        }
    }

    private static void AddHostOnly(List<AzureInventoryAppSettingHostParsedFields> results, string host)
    {
        if (string.IsNullOrWhiteSpace(host))
        {
            return;
        }

        foreach (AzureInventoryAppSettingHostParsedFields existing in results)
        {
            if (string.Equals(existing.Host, host, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }
        }

        results.Add(new AzureInventoryAppSettingHostParsedFields { Host = host });
    }

    private static string NormalizeHost(string host)
    {
        string normalized = host.Trim().TrimEnd('/').ToLowerInvariant();
        int queryOrFragmentStart = normalized.IndexOfAny(['?', '#']);

        if (queryOrFragmentStart >= 0)
        {
            normalized = normalized[..queryOrFragmentStart];
        }

        return normalized.TrimEnd('/');
    }

    private static string NormalizeStorageHost(string host)
    {
        string normalized = NormalizeHost(host);
        string decoded = AzureInventoryAppSettingHostRedactor.StripDecodedInventoryHostPathSeparators(
            Uri.UnescapeDataString(normalized));

        return Uri.TryCreate($"https://{decoded}/", UriKind.Absolute, out Uri? uri)
            ? uri.Host.ToLowerInvariant()
            : decoded;
    }

    private static string NormalizeCosmosHost(string host)
    {
        string normalized = NormalizeHost(host);
        string decoded = AzureInventoryAppSettingHostRedactor.StripDecodedInventoryHostPathSeparators(
            Uri.UnescapeDataString(normalized));

        return Uri.TryCreate($"https://{decoded}/", UriKind.Absolute, out Uri? uri)
            ? uri.Host.ToLowerInvariant()
            : decoded;
    }

    private static string NormalizeRedisHost(string host)
    {
        string normalized = NormalizeHost(host);
        string decoded = AzureInventoryAppSettingHostRedactor.StripDecodedInventoryHostPathSeparators(
            Uri.UnescapeDataString(normalized));

        return Uri.TryCreate($"https://{decoded}/", UriKind.Absolute, out Uri? uri)
            ? uri.Host.ToLowerInvariant()
            : decoded;
    }

    private static string NormalizeEndpointSuffix(string suffix)
    {
        string trimmed = suffix.Trim().ToLowerInvariant();
        int queryOrFragmentStart = trimmed.IndexOfAny(['?', '#']);

        if (queryOrFragmentStart >= 0)
        {
            trimmed = trimmed[..queryOrFragmentStart];
        }

        return Uri.UnescapeDataString(trimmed.Trim());
    }

    private static string NormalizeServiceBusHost(string host)
    {
        string normalized = NormalizeHost(host);
        string decoded = AzureInventoryAppSettingHostRedactor.StripDecodedInventoryHostPathSeparators(
            Uri.UnescapeDataString(normalized));

        int portSeparatorIndex = decoded.LastIndexOf(':');

        if (portSeparatorIndex > 0
            && portSeparatorIndex < decoded.Length - 1
            && int.TryParse(decoded.AsSpan(portSeparatorIndex + 1), out _))
        {
            return decoded.ToLowerInvariant();
        }

        return Uri.TryCreate($"https://{decoded}/", UriKind.Absolute, out Uri? uri)
            ? uri.Host.ToLowerInvariant()
            : decoded;
    }

    private static Regex StorageEndpointRegex(string endpointKey)
    {
        return new Regex(
            $"{endpointKey}\\s*=\\s*https?://(?<host>[^/\\s;]+)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    [GeneratedRegex(@"AccountName\s*=\s*(?<name>[^;]+)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex StorageAccountNameRegex();

    [GeneratedRegex("^[a-z0-9]{3,24}$", RegexOptions.CultureInvariant)]
    private static partial Regex StorageAccountNameValueRegex();

    [GeneratedRegex(@"EndpointSuffix\s*=\s*(?<suffix>[^;]+)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex StorageEndpointSuffixRegex();

    [GeneratedRegex(@"Endpoint\s*=\s*sb://(?<host>[^/;\s]+)/?", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex ServiceBusEndpointRegex();

    [GeneratedRegex(@"https?://(?<host>[^/\s;]+\.documents\.azure\.com)(?![-.\w])", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex CosmosDocumentsHostRegex();

    [GeneratedRegex(
        @"AccountEndpoint\s*=\s*(?:https?://)?(?<host>[^/\s;]+\.documents\.azure\.(?:com|cn|us))(?=[;/\s]|$)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex CosmosAccountEndpointHostRegex();

    [GeneratedRegex(
        @"(?<host>[^,;\s]+\.(?:redis\.cache\.windows\.net|redis\.azure\.net))",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex RedisCacheHostRegex();
}
