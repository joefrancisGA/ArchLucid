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

        List<string> endpointHosts = [];

        foreach (string endpointKey in new[] { "QueueEndpoint", "TableEndpoint", "FileEndpoint", "BlobEndpoint" })
        {
            Match endpointMatch = StorageEndpointRegex(endpointKey).Match(value);

            if (!endpointMatch.Success)
            {
                continue;
            }

            string host = NormalizeHost(endpointMatch.Groups["host"].Value);

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

        string suffix = suffixMatch.Groups["suffix"].Value.Trim().ToLowerInvariant();

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

        string host = NormalizeHost(match.Groups["host"].Value);

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
            string host = NormalizeHost(match.Groups["host"].Value);

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

        string accountHost = NormalizeHost(accountEndpointMatch.Groups["host"].Value);

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

        string host = NormalizeHost(match.Groups["host"].Value);

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
        return host.Trim().TrimEnd('/').ToLowerInvariant();
    }

    private static Regex StorageEndpointRegex(string endpointKey)
    {
        return new Regex(
            $"{endpointKey}\\s*=\\s*https?://(?<host>[^/\\s;]+)",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    [GeneratedRegex(@"AccountName\s*=\s*(?<name>[^;]+)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex StorageAccountNameRegex();

    [GeneratedRegex(@"EndpointSuffix\s*=\s*(?<suffix>[^;]+)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex StorageEndpointSuffixRegex();

    [GeneratedRegex(@"Endpoint\s*=\s*sb://(?<host>[^/;\s]+)/?", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex ServiceBusEndpointRegex();

    [GeneratedRegex(@"https?://(?<host>[^/\s;]+\.documents\.azure\.com)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex CosmosDocumentsHostRegex();

    [GeneratedRegex(
        @"AccountEndpoint\s*=\s*(?:https?://)?(?<host>[^/\s;]+\.documents\.azure\.(?:com|cn|us))",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex CosmosAccountEndpointHostRegex();

    [GeneratedRegex(
        @"(?<host>[^,;\s]+\.(?:redis\.cache\.windows\.net|redis\.azure\.net))",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex RedisCacheHostRegex();
}
