using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureManagementPostReadClient(
    HttpClient httpClient,
    ILogger<HostedAzureManagementPostReadClient> logger) : IHostedAzureManagementPostReadClient
{
    private const string CostQueryApiVersion = "2023-03-01";
    private const string PolicyStatesApiVersion = "2019-10-01";
    private const int MaxCostPages = 64;
    private const int MaxPolicyPages = 64;
    private const int PolicyPageSize = 450;
    private const string ContainerServiceApiVersion = "2024-02-01";
    private const int MaxAksCommandPolls = 15;
    private static readonly TimeSpan AksCommandPollDelay = TimeSpan.FromSeconds(2);

    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly HttpClient _httpClient =
        httpClient ?? throw new ArgumentNullException(nameof(httpClient));

    private readonly ILogger<HostedAzureManagementPostReadClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<HostedAzureActualCostSummary?> TryQueryActualCostSummaryAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        string postUrl =
            $"https://management.azure.com/subscriptions/{subscriptionId.Trim()}/providers/Microsoft.CostManagement/query?api-version={CostQueryApiVersion}";

        string requestBody = JsonSerializer.Serialize(new
        {
            type = "ActualCost",
            timeframe = "MonthToDate",
            dataset = new
            {
                granularity = "None",
                grouping = new[] { new { type = "Dimension", name = "ServiceName" } },
                aggregation = new { totalCost = new { name = "PreTaxCost", function = "Sum" } },
            },
        }, SerializerOptions);

        List<JsonElement> pages = [];

        try
        {
            string? cursor = postUrl;
            bool stillPost = true;
            string? body = requestBody;
            HashSet<string> seenUrls = new(StringComparer.OrdinalIgnoreCase);

            for (int pageIndex = 0; pageIndex < MaxCostPages && !string.IsNullOrWhiteSpace(cursor); pageIndex++)
            {
                if (!seenUrls.Add(cursor.Trim()))
                {
                    _logger.LogWarning(
                        "Hosted Azure extractor stopped ActualCost paging due to repeating nextLink for subscription {SubscriptionId}.",
                        subscriptionId);

                    break;
                }

                using HttpRequestMessage request = new(
                    stillPost ? HttpMethod.Post : HttpMethod.Get,
                    cursor);

                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

                if (stillPost && !string.IsNullOrWhiteSpace(body))
                {
                    request.Content = new StringContent(body, Encoding.UTF8, "application/json");
                }

                using HttpResponseMessage response =
                    await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

                if (!response.IsSuccessStatusCode)
                {
                    string errorBody = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

                    _logger.LogWarning(
                        "Hosted Azure extractor skipped ActualCost for subscription {SubscriptionId}; HTTP {StatusCode}. {Body}",
                        subscriptionId,
                        (int)response.StatusCode,
                        Truncate(errorBody, 500));

                    if (pages.Count > 0)
                    {
                        break;
                    }

                    return null;
                }

                await using Stream stream =
                    await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

                using JsonDocument document =
                    await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken).ConfigureAwait(false);

                pages.Add(document.RootElement.Clone());

                cursor = null;
                stillPost = false;
                body = null;

                if (document.RootElement.TryGetProperty("properties", out JsonElement properties)
                    && properties.TryGetProperty("nextLink", out JsonElement nextLinkElement)
                    && nextLinkElement.ValueKind == JsonValueKind.String)
                {
                    string? next = nextLinkElement.GetString();

                    if (!string.IsNullOrWhiteSpace(next))
                    {
                        HostedAzureArmNextLinkValidator.EnsureTargetsSubscription(next, subscriptionId);
                        HostedAzureArmNextLinkValidator.EnsureTargetsArmRelativeListingPath(
                            next,
                            $"subscriptions/{subscriptionId.Trim()}/providers/Microsoft.CostManagement/query");
                        cursor = next;
                    }
                }
            }

            return MergeActualCostPages(pages, "MonthToDate");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(
                ex,
                "Hosted Azure extractor skipped ActualCost for subscription {SubscriptionId}.",
                subscriptionId);

            // Retain merged pages when a follow-up response body is malformed; do not mask nextLink validation failures.
            if (pages.Count > 0 && ex is JsonException)
            {
                return MergeActualCostPages(pages, "MonthToDate");
            }

            return null;
        }
    }

    public async Task<HostedAzurePolicyComplianceDocument> QueryPolicyComplianceAsync(
        string accessToken,
        string subscriptionId,
        string scopeDescriptor,
        string collectionTimestampUtc,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        string initialPath =
            $"/subscriptions/{subscriptionId.Trim()}/providers/Microsoft.PolicyInsights/policyStates/latest/queryResults?api-version={PolicyStatesApiVersion}&$top={PolicyPageSize}&$orderby={Uri.EscapeDataString("Timestamp desc")}";

        List<JsonElement> records = [];
        string? cursor = initialPath;
        HashSet<string> seenPaths = new(StringComparer.OrdinalIgnoreCase);

        try
        {
            for (int pageIndex = 0; pageIndex < MaxPolicyPages && !string.IsNullOrWhiteSpace(cursor); pageIndex++)
            {
                if (!seenPaths.Add(cursor.Trim()))
                {
                    break;
                }

                string requestUrl = cursor.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                    ? cursor
                    : $"https://management.azure.com{cursor.TrimStart('/')}";

                using HttpRequestMessage request = new(HttpMethod.Post, requestUrl);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                request.Content = new StringContent("{}", Encoding.UTF8, "application/json");

                using HttpResponseMessage response =
                    await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

                if (!response.IsSuccessStatusCode)
                {
                    string errorBody = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

                    _logger.LogWarning(
                        "Hosted Azure extractor policy compliance query failed for subscription {SubscriptionId}; HTTP {StatusCode}. {Body}",
                        subscriptionId,
                        (int)response.StatusCode,
                        Truncate(errorBody, 500));

                    if (records.Count > 0)
                    {
                        break;
                    }

                    return CreateEmptyPolicyCompliance(scopeDescriptor, collectionTimestampUtc, records);
                }

                await using Stream stream =
                    await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

                using JsonDocument document =
                    await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken).ConfigureAwait(false);

                if (document.RootElement.TryGetProperty("value", out JsonElement valueElement)
                    && valueElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (JsonElement row in valueElement.EnumerateArray())
                    {
                        records.Add(row.Clone());
                    }
                }

                cursor = null;

                string? nextAbsolute = TryReadNextLink(document.RootElement);

                if (!string.IsNullOrWhiteSpace(nextAbsolute))
                {
                    HostedAzureArmNextLinkValidator.EnsureTargetsSubscription(nextAbsolute, subscriptionId);
                    HostedAzureArmNextLinkValidator.EnsureTargetsArmRelativeListingPath(
                        nextAbsolute,
                        $"subscriptions/{subscriptionId.Trim()}/providers/Microsoft.PolicyInsights/policyStates/latest/queryResults");
                    cursor = TryToRelativePath(nextAbsolute) ?? nextAbsolute;
                }
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(
                ex,
                "Hosted Azure extractor policy compliance query failed for subscription {SubscriptionId}.",
                subscriptionId);

            if (records.Count == 0)
            {
                return CreateEmptyPolicyCompliance(scopeDescriptor, collectionTimestampUtc, records);
            }
        }

        return new HostedAzurePolicyComplianceDocument
        {
            CollectionTimestampUtc = collectionTimestampUtc,
            Scope = scopeDescriptor,
            ReaderNote =
                "Policy Insights queryResults read aligns with RBAC Reader at subscription or resource-group scope.",
            RecordCount = records.Count,
            Records = records,
        };
    }

    public async Task<HostedAzureAksRunCommandResult> RunAksWorkloadImageCommandAsync(
        string accessToken,
        string clusterResourceId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(clusterResourceId);

        string normalizedResourceId = clusterResourceId.Trim().TrimEnd('/');
        string runCommandUrl =
            $"https://management.azure.com{normalizedResourceId}/runCommand?api-version={ContainerServiceApiVersion}";
        string requestBody = JsonSerializer.Serialize(new
        {
            command =
                "kubectl get deployments,statefulsets,daemonsets,jobs,cronjobs -A -o jsonpath='{range .items[*]}{range .spec.template.spec.containers[*]}{.image}{\"\\n\"}{end}{range .spec.template.spec.initContainers[*]}{.image}{\"\\n\"}{end}{end}'",
        }, SerializerOptions);

        try
        {
            using HttpRequestMessage request = new(HttpMethod.Post, runCommandUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            request.Content = new StringContent(requestBody, Encoding.UTF8, "application/json");

            using HttpResponseMessage response =
                await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                int statusCode = (int)response.StatusCode;
                LogAksCommandFailure(clusterResourceId, statusCode, exception: null);
                return HostedAzureAksRunCommandResult.Failed(
                    MapHttpStatusToRunCommandStatus(statusCode),
                    statusCode);
            }

            await using Stream stream =
                await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
            using JsonDocument commandDocument =
                await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken).ConfigureAwait(false);

            HostedAzureAksRunCommandResult? immediateResult =
                TryInterpretAksCommandDocument(commandDocument.RootElement);

            if (immediateResult is not null)
            {
                return immediateResult;
            }

            string? commandResultUrl = TryNormalizeAksCommandResultUrl(
                TryReadString(commandDocument.RootElement, "id"));

            if (string.IsNullOrWhiteSpace(commandResultUrl))
            {
                return HostedAzureAksRunCommandResult.Failed(HostedAzureAksRunCommandStatus.Unavailable);
            }

            for (int poll = 0; poll < MaxAksCommandPolls; poll++)
            {
                await Task.Delay(AksCommandPollDelay, cancellationToken).ConfigureAwait(false);

                using HttpRequestMessage pollRequest = new(HttpMethod.Get, commandResultUrl);
                pollRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

                using HttpResponseMessage pollResponse =
                    await _httpClient.SendAsync(pollRequest, cancellationToken).ConfigureAwait(false);

                if (!pollResponse.IsSuccessStatusCode)
                {
                    int statusCode = (int)pollResponse.StatusCode;
                    LogAksCommandFailure(clusterResourceId, statusCode, exception: null);
                    return HostedAzureAksRunCommandResult.Failed(
                        MapHttpStatusToRunCommandStatus(statusCode),
                        statusCode);
                }

                await using Stream pollStream =
                    await pollResponse.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
                using JsonDocument pollDocument =
                    await JsonDocument.ParseAsync(pollStream, cancellationToken: cancellationToken)
                        .ConfigureAwait(false);

                immediateResult = TryInterpretAksCommandDocument(pollDocument.RootElement);

                if (immediateResult is not null)
                {
                    return immediateResult;
                }

                if (IsAksCommandTerminal(pollDocument.RootElement))
                {
                    return HostedAzureAksRunCommandResult.Failed(HostedAzureAksRunCommandStatus.RunCommandFailed);
                }
            }

            return HostedAzureAksRunCommandResult.Failed(HostedAzureAksRunCommandStatus.PollTimeout);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            LogAksCommandFailure(clusterResourceId, statusCode: null, ex);
            return HostedAzureAksRunCommandResult.Failed(HostedAzureAksRunCommandStatus.Error);
        }
    }

    private static HostedAzureAksRunCommandStatus MapHttpStatusToRunCommandStatus(int statusCode)
    {
        return statusCode is 401 or 403
            ? HostedAzureAksRunCommandStatus.InsufficientRbac
            : HostedAzureAksRunCommandStatus.HttpError;
    }

    private static HostedAzureAksRunCommandResult? TryInterpretAksCommandDocument(JsonElement root)
    {
        if (!root.TryGetProperty("properties", out JsonElement properties)
            || properties.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        string? provisioningState = TryReadString(properties, "provisioningState");

        if (string.IsNullOrWhiteSpace(provisioningState))
        {
            return null;
        }

        if (string.Equals(provisioningState, "Failed", StringComparison.OrdinalIgnoreCase)
            || string.Equals(provisioningState, "Canceled", StringComparison.OrdinalIgnoreCase)
            || string.Equals(provisioningState, "Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            return HostedAzureAksRunCommandResult.Failed(HostedAzureAksRunCommandStatus.RunCommandFailed);
        }

        if (!string.Equals(provisioningState, "Succeeded", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        if (!properties.TryGetProperty("logs", out JsonElement logsElement))
        {
            return HostedAzureAksRunCommandResult.Failed(HostedAzureAksRunCommandStatus.MissingLogs);
        }

        string logs = logsElement.ValueKind is JsonValueKind.String
            ? logsElement.GetString() ?? string.Empty
            : string.Empty;

        return HostedAzureAksRunCommandResult.SucceededWithLogs(logs);
    }

    private void LogAksCommandFailure(string clusterResourceId, int? statusCode, Exception? exception)
    {
        _logger.LogWarning(
            exception,
            "Hosted Azure extractor could not collect AKS workload images for {ClusterResourceId}. StatusCode={StatusCode}.",
            clusterResourceId,
            statusCode);
    }

    private static bool IsAksCommandTerminal(JsonElement root)
    {
        if (!root.TryGetProperty("properties", out JsonElement properties)
            || properties.ValueKind is not JsonValueKind.Object)
        {
            return true;
        }

        string? provisioningState = TryReadString(properties, "provisioningState");

        return string.Equals(provisioningState, "Failed", StringComparison.OrdinalIgnoreCase)
            || string.Equals(provisioningState, "Canceled", StringComparison.OrdinalIgnoreCase)
            || string.Equals(provisioningState, "Canceling", StringComparison.OrdinalIgnoreCase);
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out JsonElement value)
            && value.ValueKind is JsonValueKind.String
            ? value.GetString()
            : null;
    }

    private static string? TryNormalizeAksCommandResultUrl(string? commandResultUrl)
    {
        if (string.IsNullOrWhiteSpace(commandResultUrl))
        {
            return null;
        }

        string candidate = commandResultUrl.Trim();

        if (candidate.StartsWith("/", StringComparison.Ordinal))
        {
            candidate = $"https://management.azure.com{candidate}";
        }

        if (!Uri.TryCreate(candidate, UriKind.Absolute, out Uri? uri)
            || !string.Equals(uri.Host, "management.azure.com", StringComparison.OrdinalIgnoreCase)
            || !uri.AbsolutePath.Contains("/commandResults/", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        if (uri.Query.Contains("api-version=", StringComparison.OrdinalIgnoreCase))
        {
            return uri.AbsoluteUri;
        }

        string separator = string.IsNullOrEmpty(uri.Query) ? "?" : "&";

        return $"{uri.AbsoluteUri}{separator}api-version={ContainerServiceApiVersion}";
    }

    private static HostedAzurePolicyComplianceDocument CreateEmptyPolicyCompliance(
        string scopeDescriptor,
        string collectionTimestampUtc,
        List<JsonElement> records)
    {
        return new HostedAzurePolicyComplianceDocument
        {
            CollectionTimestampUtc = collectionTimestampUtc,
            Scope = scopeDescriptor,
            ReaderNote =
                "Policy compliance collection failed or was not authorized; empty records emitted so the ZIP remains uploadable.",
            RecordCount = records.Count,
            Records = records,
        };
    }

    private static HostedAzureActualCostSummary? MergeActualCostPages(
        IReadOnlyList<JsonElement> pages,
        string billingPeriod)
    {
        if (pages.Count == 0)
        {
            return null;
        }

        JsonElement? referenceColumns = null;
        Dictionary<string, double> bucket = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> currencies = new(StringComparer.OrdinalIgnoreCase);
        bool aggregatedAnyRow = false;

        foreach (JsonElement page in pages)
        {
            if (!page.TryGetProperty("properties", out JsonElement properties)
                || !properties.TryGetProperty("columns", out JsonElement pageColumns))
            {
                continue;
            }

            if (referenceColumns is null)
            {
                referenceColumns = pageColumns.Clone();
            }

            int preTaxIndex = FindColumnIndex(pageColumns, "PreTaxCost");
            int serviceIndex = FindColumnIndex(pageColumns, "ServiceName");
            int currencyIndex = FindColumnIndex(pageColumns, "Currency");

            if (preTaxIndex < 0 || serviceIndex < 0)
            {
                continue;
            }

            if (!properties.TryGetProperty("rows", out JsonElement pageRows)
                || pageRows.ValueKind is not JsonValueKind.Array)
            {
                continue;
            }

            foreach (JsonElement row in pageRows.EnumerateArray())
            {
                if (row.ValueKind != JsonValueKind.Array)
                {
                    continue;
                }

                string serviceName = ReadArrayCell(row, serviceIndex);

                if (string.IsNullOrWhiteSpace(serviceName))
                {
                    serviceName = "(unset-service-name)";
                }

                double increment = ReadArrayCellDouble(row, preTaxIndex);

                if (bucket.TryGetValue(serviceName, out double existing))
                {
                    bucket[serviceName] = existing + increment;
                }
                else
                {
                    bucket[serviceName] = increment;
                }

                aggregatedAnyRow = true;

                if (currencyIndex >= 0)
                {
                    string currency = ReadArrayCell(row, currencyIndex);

                    if (!string.IsNullOrWhiteSpace(currency))
                    {
                        currencies.Add(currency.Trim());
                    }
                }
            }
        }

        if (referenceColumns is null || !aggregatedAnyRow)
        {
            return null;
        }

        double total = bucket.Values.Sum();
        string currencyCode = currencies.Count switch
        {
            0 => "unknown",
            1 => currencies.First(),
            _ => string.Join('|', currencies.OrderBy(static c => c, StringComparer.OrdinalIgnoreCase)),
        };

        List<HostedAzureActualCostServiceBreakdownRow> breakdown = bucket
            .OrderBy(static entry => entry.Key, StringComparer.OrdinalIgnoreCase)
            .Select(static entry => new HostedAzureActualCostServiceBreakdownRow(entry.Key, entry.Value))
            .ToList();

        return new HostedAzureActualCostSummary(
            Math.Round(total, 6),
            currencyCode,
            billingPeriod,
            breakdown);
    }

    private static int FindColumnIndex(JsonElement columns, string name)
    {
        if (columns.ValueKind != JsonValueKind.Array)
        {
            return -1;
        }

        int index = 0;

        foreach (JsonElement column in columns.EnumerateArray())
        {
            if (column.TryGetProperty("name", out JsonElement nameElement)
                && nameElement.ValueKind == JsonValueKind.String
                && string.Equals(nameElement.GetString(), name, StringComparison.OrdinalIgnoreCase))
            {
                return index;
            }

            index++;
        }

        return -1;
    }

    private static string ReadArrayCell(JsonElement row, int index)
    {
        if (row.ValueKind != JsonValueKind.Array)
        {
            return string.Empty;
        }

        int current = 0;

        foreach (JsonElement cell in row.EnumerateArray())
        {
            if (current == index)
            {
                return cell.ValueKind == JsonValueKind.String ? cell.GetString() ?? string.Empty : cell.ToString();
            }

            current++;
        }

        return string.Empty;
    }

    private static double ReadArrayCellDouble(JsonElement row, int index)
    {
        string text = ReadArrayCell(row, index);

        return double.TryParse(text, NumberStyles.Float, CultureInfo.InvariantCulture, out double parsed)
            ? parsed
            : 0d;
    }

    private static string? TryReadNextLink(JsonElement root)
    {
        foreach (JsonProperty property in root.EnumerateObject())
        {
            if (!property.Name.Equals("@odata.nextLink", StringComparison.OrdinalIgnoreCase)
                && !property.Name.Equals("odata.nextLink", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (property.Value.ValueKind == JsonValueKind.String)
            {
                return property.Value.GetString();
            }
        }

        return null;
    }

    private static string? TryToRelativePath(string absoluteOrRelative)
    {
        if (string.IsNullOrWhiteSpace(absoluteOrRelative))
        {
            return null;
        }

        if (!absoluteOrRelative.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            return absoluteOrRelative;
        }

        if (!Uri.TryCreate(absoluteOrRelative, UriKind.Absolute, out Uri? uri))
        {
            return null;
        }

        return uri.PathAndQuery;
    }

    private static string Truncate(string value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length <= maxLength)
        {
            return value;
        }

        return value[..maxLength];
    }
}
