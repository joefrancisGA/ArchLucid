using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     GET-only ARM reader for subscription resource inventory.
/// </summary>
public sealed class GetOnlyHostedAzureArmReadClient(
    HttpClient httpClient,
    ILogger<GetOnlyHostedAzureArmReadClient> logger) : IHostedAzureArmReadClient
{
    private const string ResourcesApiVersion = "2021-04-01";
    private const string RoleAssignmentsApiVersion = "2022-04-01";
    private const string RoleEligibilitySchedulesApiVersion = "2020-10-01";
    private const string FederatedCredentialsApiVersion = "2023-01-31";
    private const string PolicyAssignmentsApiVersion = "2022-06-01";
    private const string DiagnosticSettingsApiVersion = "2021-05-01-preview";
    private const string SecureScoresApiVersion = "2020-01-01";
    private const int MaxPaginationRequests = 64;

    private readonly HttpClient _httpClient =
        httpClient ?? throw new ArgumentNullException(nameof(httpClient));

    private readonly ILogger<GetOnlyHostedAzureArmReadClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<IReadOnlyList<HostedAzureArmResourceRecord>> ListSubscriptionResourcesAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        List<HostedAzureArmResourceRecord> resources = [];
        string? nextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId.Trim()}/resources?api-version={ResourcesApiVersion}";
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                throw new InvalidOperationException(
                    "Hosted Azure extractor stopped ARM resource listing due to repeating nextLink.");
            }

            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                throw new InvalidOperationException(
                    $"Hosted Azure extractor stopped ARM resource listing after {MaxPaginationRequests} pages.");
            }

            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage response =
                await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            response.EnsureSuccessStatusCode();

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

            using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            if (document.RootElement.TryGetProperty("value", out JsonElement valueElement) &&
                valueElement.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement item in valueElement.EnumerateArray())
                {
                    HostedAzureArmResourceRecord? mapped = MapResource(item);

                    if (mapped is not null)
                    {
                        resources.Add(mapped);
                        continue;
                    }

                    LogSkippedArmRow(item);
                }
            }

            nextLink = null;

            if (document.RootElement.TryGetProperty("nextLink", out JsonElement nextLinkElement) &&
                nextLinkElement.ValueKind == JsonValueKind.String)
            {
                string? candidateNextLink = nextLinkElement.GetString();

                if (!string.IsNullOrWhiteSpace(candidateNextLink))
                {
                    HostedAzureArmNextLinkValidator.EnsureTargetsSubscription(
                        candidateNextLink,
                        subscriptionId);
                    nextLink = candidateNextLink;
                }
            }
        }

        if (_logger.IsEnabled(LogLevel.Debug))
        {
            _logger.LogDebug(
                "Hosted Azure extractor listed {Count} resources for subscription {SubscriptionId}.",
                resources.Count,
                subscriptionId);
        }

        return resources;
    }

    public async Task<IReadOnlyList<HostedAzureArmRoleAssignmentRecord>> ListSubscriptionRoleAssignmentsAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        List<HostedAzureArmRoleAssignmentRecord> assignments = [];
        string? nextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId.Trim()}/providers/Microsoft.Authorization/roleAssignments?api-version={RoleAssignmentsApiVersion}";
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                throw new InvalidOperationException(
                    "Hosted Azure extractor stopped ARM role assignment listing due to repeating nextLink.");
            }

            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                throw new InvalidOperationException(
                    $"Hosted Azure extractor stopped ARM role assignment listing after {MaxPaginationRequests} pages.");
            }

            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage response =
                await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            response.EnsureSuccessStatusCode();

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

            using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            if (document.RootElement.TryGetProperty("value", out JsonElement valueElement) &&
                valueElement.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement item in valueElement.EnumerateArray())
                {
                    HostedAzureArmRoleAssignmentRecord? mapped = MapRoleAssignment(item);

                    if (mapped is not null)
                    {
                        assignments.Add(mapped);
                    }
                }
            }

            nextLink = null;

            if (document.RootElement.TryGetProperty("nextLink", out JsonElement nextLinkElement) &&
                nextLinkElement.ValueKind == JsonValueKind.String)
            {
                string? candidateNextLink = nextLinkElement.GetString();

                if (!string.IsNullOrWhiteSpace(candidateNextLink))
                {
                    HostedAzureArmNextLinkValidator.EnsureTargetsSubscription(
                        candidateNextLink,
                        subscriptionId);
                    nextLink = candidateNextLink;
                }
            }
        }

        if (_logger.IsEnabled(LogLevel.Debug))
        {
            _logger.LogDebug(
                "Hosted Azure extractor listed {Count} role assignments for subscription {SubscriptionId}.",
                assignments.Count,
                subscriptionId);
        }

        return assignments;
    }

    public async Task<IReadOnlyList<HostedAzureArmRoleAssignmentRecord>> ListSubscriptionRoleEligibilitySchedulesAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        List<HostedAzureArmRoleAssignmentRecord> schedules = [];
        string? nextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId.Trim()}/providers/Microsoft.Authorization/roleEligibilitySchedules?api-version={RoleEligibilitySchedulesApiVersion}&$filter=asTarget()";
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                throw new InvalidOperationException(
                    "Hosted Azure extractor stopped ARM role eligibility listing due to repeating nextLink.");
            }

            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                throw new InvalidOperationException(
                    $"Hosted Azure extractor stopped ARM role eligibility listing after {MaxPaginationRequests} pages.");
            }

            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage response =
                await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug(
                        "Hosted Azure extractor skipped role eligibility schedules for subscription {SubscriptionId}; HTTP {StatusCode}.",
                        subscriptionId,
                        (int)response.StatusCode);
                }

                break;
            }

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

            using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            if (document.RootElement.TryGetProperty("value", out JsonElement valueElement) &&
                valueElement.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement item in valueElement.EnumerateArray())
                {
                    HostedAzureArmRoleAssignmentRecord? mapped = MapRoleEligibilitySchedule(item);

                    if (mapped is not null)
                    {
                        schedules.Add(mapped);
                    }
                }
            }

            nextLink = null;

            if (document.RootElement.TryGetProperty("nextLink", out JsonElement nextLinkElement) &&
                nextLinkElement.ValueKind == JsonValueKind.String)
            {
                string? candidateNextLink = nextLinkElement.GetString();

                if (!string.IsNullOrWhiteSpace(candidateNextLink))
                {
                    HostedAzureArmNextLinkValidator.EnsureTargetsSubscription(
                        candidateNextLink,
                        subscriptionId);
                    nextLink = candidateNextLink;
                }
            }
        }

        if (_logger.IsEnabled(LogLevel.Debug))
        {
            _logger.LogDebug(
                "Hosted Azure extractor listed {Count} role eligibility schedules for subscription {SubscriptionId}.",
                schedules.Count,
                subscriptionId);
        }

        return schedules;
    }

    public async Task<string?> TryGetSubscriptionDisplayNameAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        string url =
            $"https://management.azure.com/subscriptions/{subscriptionId.Trim()}?api-version={ResourcesApiVersion}";

        try
        {
            using HttpRequestMessage request = new(HttpMethod.Get, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage response =
                await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                LogSubscriptionDisplayNameFailure(subscriptionId, (int)response.StatusCode, exception: null);
                return null;
            }

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

            using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            return ReadSubscriptionDisplayName(document.RootElement);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            LogSubscriptionDisplayNameFailure(subscriptionId, statusCode: null, ex);
            return null;
        }
    }

    private void LogSubscriptionDisplayNameFailure(string subscriptionId, int? statusCode, Exception? exception)
    {
        if (!_logger.IsEnabled(LogLevel.Warning))
            return;

        _logger.LogWarning(
            exception,
            "Hosted Azure extractor could not read subscription display name for {SubscriptionId}. StatusCode={StatusCode}.",
            subscriptionId,
            statusCode);
    }

    private static string? ReadSubscriptionDisplayName(JsonElement root)
    {
        if (!root.TryGetProperty("displayName", out JsonElement displayName) ||
            displayName.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        return AzureExtractorSubscriptionDisplayName.Normalize(displayName.GetString());
    }

    public async Task<IReadOnlyList<string>> ListManagementGroupSubscriptionIdsAsync(
        string accessToken,
        string managementGroupId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        HostedAzureExtractorGuidValidator.RequireManagementGroupId(nameof(managementGroupId), managementGroupId);

        List<string> subscriptionIds = [];
        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);
        string? nextLink =
            $"https://management.azure.com/providers/Microsoft.Management/managementGroups/{managementGroupId.Trim()}/subscriptions?api-version=2020-05-01";
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                throw new InvalidOperationException(
                    "Hosted Azure extractor stopped ARM management group subscription listing due to repeating nextLink.");
            }

            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                throw new InvalidOperationException(
                    $"Hosted Azure extractor stopped ARM management group subscription listing after {MaxPaginationRequests} pages.");
            }

            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage response =
                await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug(
                        "Hosted Azure extractor skipped management group subscription listing for {ManagementGroupId}; HTTP {StatusCode}.",
                        managementGroupId,
                        (int)response.StatusCode);
                }

                break;
            }

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

            using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            if (document.RootElement.TryGetProperty("value", out JsonElement valueElement)
                && valueElement.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement item in valueElement.EnumerateArray())
                {
                    string? subscriptionId = TryGetManagementGroupSubscriptionId(item);

                    if (string.IsNullOrWhiteSpace(subscriptionId))
                    {
                        continue;
                    }

                    if (seen.Add(subscriptionId))
                    {
                        subscriptionIds.Add(subscriptionId);
                    }
                }
            }

            nextLink = null;

            if (document.RootElement.TryGetProperty("nextLink", out JsonElement nextLinkElement)
                && nextLinkElement.ValueKind == JsonValueKind.String)
            {
                string? candidateNextLink = nextLinkElement.GetString();

                if (!string.IsNullOrWhiteSpace(candidateNextLink))
                {
                    HostedAzureArmNextLinkValidator.EnsureTargetsManagementGroup(
                        candidateNextLink,
                        managementGroupId);
                    nextLink = candidateNextLink;
                }
            }
        }

        if (_logger.IsEnabled(LogLevel.Debug))
        {
            _logger.LogDebug(
                "Hosted Azure extractor listed {Count} subscriptions for management group {ManagementGroupId}.",
                subscriptionIds.Count,
                managementGroupId);
        }

        return subscriptionIds;
    }

    public async Task<IReadOnlyList<HostedAzureArmRoleAssignmentRecord>> ListManagementGroupRoleAssignmentsAsync(
        string accessToken,
        string managementGroupId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        HostedAzureExtractorGuidValidator.RequireManagementGroupId(nameof(managementGroupId), managementGroupId);

        return await ListRoleAssignmentsAtRestPathAsync(
            accessToken,
            $"https://management.azure.com/providers/Microsoft.Management/managementGroups/{managementGroupId.Trim()}/providers/Microsoft.Authorization/roleAssignments?api-version={RoleAssignmentsApiVersion}",
            managementGroupId,
            "management group role assignment",
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<HostedAzureArmRoleAssignmentRecord>> ListManagementGroupRoleEligibilitySchedulesAsync(
        string accessToken,
        string managementGroupId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        HostedAzureExtractorGuidValidator.RequireManagementGroupId(nameof(managementGroupId), managementGroupId);

        return await ListRoleEligibilitySchedulesAtRestPathAsync(
            accessToken,
            $"https://management.azure.com/providers/Microsoft.Management/managementGroups/{managementGroupId.Trim()}/providers/Microsoft.Authorization/roleEligibilitySchedules?api-version={RoleEligibilitySchedulesApiVersion}&$filter=asTarget()",
            managementGroupId,
            cancellationToken).ConfigureAwait(false);
    }

    private async Task<IReadOnlyList<HostedAzureArmRoleAssignmentRecord>> ListRoleAssignmentsAtRestPathAsync(
        string accessToken,
        string initialUrl,
        string managementGroupId,
        string listingKind,
        CancellationToken cancellationToken)
    {
        List<HostedAzureArmRoleAssignmentRecord> assignments = [];
        string? nextLink = initialUrl;
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                throw new InvalidOperationException(
                    $"Hosted Azure extractor stopped ARM {listingKind} listing due to repeating nextLink.");
            }

            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                throw new InvalidOperationException(
                    $"Hosted Azure extractor stopped ARM {listingKind} listing after {MaxPaginationRequests} pages.");
            }

            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage response =
                await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug(
                        "Hosted Azure extractor skipped {ListingKind} listing for management group {ManagementGroupId}; HTTP {StatusCode}.",
                        listingKind,
                        managementGroupId,
                        (int)response.StatusCode);
                }

                break;
            }

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

            using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            if (document.RootElement.TryGetProperty("value", out JsonElement valueElement)
                && valueElement.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement item in valueElement.EnumerateArray())
                {
                    HostedAzureArmRoleAssignmentRecord? mapped = MapRoleAssignment(item);

                    if (mapped is not null)
                    {
                        assignments.Add(mapped);
                    }
                }
            }

            nextLink = null;

            if (document.RootElement.TryGetProperty("nextLink", out JsonElement nextLinkElement)
                && nextLinkElement.ValueKind == JsonValueKind.String)
            {
                string? candidateNextLink = nextLinkElement.GetString();

                if (!string.IsNullOrWhiteSpace(candidateNextLink))
                {
                    HostedAzureArmNextLinkValidator.EnsureTargetsManagementGroup(
                        candidateNextLink,
                        managementGroupId);
                    nextLink = candidateNextLink;
                }
            }
        }

        return assignments;
    }

    private async Task<IReadOnlyList<HostedAzureArmRoleAssignmentRecord>> ListRoleEligibilitySchedulesAtRestPathAsync(
        string accessToken,
        string initialUrl,
        string managementGroupId,
        CancellationToken cancellationToken)
    {
        List<HostedAzureArmRoleAssignmentRecord> schedules = [];
        string? nextLink = initialUrl;
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                throw new InvalidOperationException(
                    "Hosted Azure extractor stopped ARM management group role eligibility listing due to repeating nextLink.");
            }

            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                throw new InvalidOperationException(
                    $"Hosted Azure extractor stopped ARM management group role eligibility listing after {MaxPaginationRequests} pages.");
            }

            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage response =
                await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug(
                        "Hosted Azure extractor skipped management group role eligibility schedules for {ManagementGroupId}; HTTP {StatusCode}.",
                        managementGroupId,
                        (int)response.StatusCode);
                }

                break;
            }

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

            using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            if (document.RootElement.TryGetProperty("value", out JsonElement valueElement)
                && valueElement.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement item in valueElement.EnumerateArray())
                {
                    HostedAzureArmRoleAssignmentRecord? mapped = MapRoleEligibilitySchedule(item);

                    if (mapped is not null)
                    {
                        schedules.Add(mapped);
                    }
                }
            }

            nextLink = null;

            if (document.RootElement.TryGetProperty("nextLink", out JsonElement nextLinkElement)
                && nextLinkElement.ValueKind == JsonValueKind.String)
            {
                string? candidateNextLink = nextLinkElement.GetString();

                if (!string.IsNullOrWhiteSpace(candidateNextLink))
                {
                    HostedAzureArmNextLinkValidator.EnsureTargetsManagementGroup(
                        candidateNextLink,
                        managementGroupId);
                    nextLink = candidateNextLink;
                }
            }
        }

        return schedules;
    }

    private static string? TryGetManagementGroupSubscriptionId(JsonElement item)
    {
        if (TryGetString(item, "name", out string? name) && Guid.TryParse(name, out Guid parsedName) && parsedName != Guid.Empty)
        {
            return parsedName.ToString("D");
        }

        if (TryGetString(item, "id", out string? resourceId) && !string.IsNullOrWhiteSpace(resourceId))
        {
            const string prefix = "/subscriptions/";

            if (resourceId.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                ReadOnlySpan<char> remainder = resourceId.AsSpan(prefix.Length);
                int slashIndex = remainder.IndexOf('/');

                ReadOnlySpan<char> subscriptionId = slashIndex < 0
                    ? remainder
                    : remainder[..slashIndex];

                if (!subscriptionId.IsEmpty
                    && Guid.TryParse(subscriptionId, out Guid parsedSubscriptionId)
                    && parsedSubscriptionId != Guid.Empty)
                {
                    return parsedSubscriptionId.ToString("D");
                }
            }
        }

        return null;
    }

    public async Task<IReadOnlyList<HostedAzureArmPolicyAssignmentRecord>> ListSubscriptionPolicyAssignmentsAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        return await ListPolicyAssignmentsAtRestPathAsync(
            accessToken,
            $"https://management.azure.com/subscriptions/{subscriptionId.Trim()}/providers/Microsoft.Authorization/policyAssignments?api-version={PolicyAssignmentsApiVersion}",
            subscriptionId,
            validateSubscriptionNextLink: true,
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<HostedAzureArmPolicyAssignmentRecord>> ListManagementGroupPolicyAssignmentsAsync(
        string accessToken,
        string managementGroupId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        HostedAzureExtractorGuidValidator.RequireManagementGroupId(nameof(managementGroupId), managementGroupId);

        return await ListPolicyAssignmentsAtRestPathAsync(
            accessToken,
            $"https://management.azure.com/providers/Microsoft.Management/managementGroups/{managementGroupId.Trim()}/providers/Microsoft.Authorization/policyAssignments?api-version={PolicyAssignmentsApiVersion}",
            managementGroupId,
            validateSubscriptionNextLink: false,
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<HostedAzureArmDiagnosticSettingRecord>> ListDiagnosticSettingsAsync(
        string accessToken,
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentNullException.ThrowIfNull(resources);

        List<HostedAzureArmDiagnosticSettingRecord> settings = [];
        HashSet<string> seenKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (!HostedAzureInventoryPathRelevantDiagnosticResourceFilter.IsPathRelevant(resource.ResourceType))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(resource.ResourceId))
            {
                continue;
            }

            IReadOnlyList<HostedAzureArmDiagnosticSettingRecord> resourceSettings =
                await ListDiagnosticSettingsForResourceAsync(
                    accessToken,
                    resource.ResourceId.Trim(),
                    cancellationToken).ConfigureAwait(false);

            foreach (HostedAzureArmDiagnosticSettingRecord setting in resourceSettings)
            {
                string key = $"{setting.TargetResourceId}|{setting.Name}|{setting.WorkspaceId}";

                if (seenKeys.Add(key))
                {
                    settings.Add(setting);
                }
            }
        }

        if (_logger.IsEnabled(LogLevel.Debug))
        {
            _logger.LogDebug(
                "Hosted Azure extractor listed {Count} diagnostic settings across path-relevant resources.",
                settings.Count);
        }

        return settings;
    }

    public async Task<IReadOnlyList<HostedAzureArmDefenderSummaryRecord>> ListSubscriptionDefenderSummariesAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        string trimmedSubscriptionId = subscriptionId.Trim();
        string url =
            $"https://management.azure.com/subscriptions/{trimmedSubscriptionId}/providers/Microsoft.Security/secureScores?api-version={SecureScoresApiVersion}";

        using HttpRequestMessage request = new(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using HttpResponseMessage response =
            await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            if (_logger.IsEnabled(LogLevel.Debug))
            {
                _logger.LogDebug(
                    "Hosted Azure extractor skipped Defender secure score for subscription {SubscriptionId}; HTTP {StatusCode}.",
                    trimmedSubscriptionId,
                    (int)response.StatusCode);
            }

            return [];
        }

        await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

        using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        int? secureScore = TryReadSubscriptionSecureScorePercent(document.RootElement);

        if (secureScore is null)
        {
            return [];
        }

        return
        [
            new HostedAzureArmDefenderSummaryRecord
            {
                ResourceId = $"/subscriptions/{trimmedSubscriptionId}",
                SecureScore = secureScore.Value,
            },
        ];
    }

    private static int? TryReadSubscriptionSecureScorePercent(JsonElement root)
    {
        if (!root.TryGetProperty("value", out JsonElement valueElement)
            || valueElement.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        int? bestScore = null;

        foreach (JsonElement item in valueElement.EnumerateArray())
        {
            int? candidate = TryReadSecureScoreFromSecureScoreItem(item);

            if (candidate is null)
            {
                continue;
            }

            if (bestScore is null || candidate.Value > bestScore.Value)
            {
                bestScore = candidate.Value;
            }
        }

        return bestScore;
    }

    private static int? TryReadSecureScoreFromSecureScoreItem(JsonElement item)
    {
        if (!item.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind != JsonValueKind.Object
            || !propertiesElement.TryGetProperty("score", out JsonElement scoreElement)
            || scoreElement.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        if (scoreElement.TryGetProperty("percentage", out JsonElement percentageElement)
            && percentageElement.TryGetDouble(out double percentage))
        {
            return ClampSecureScorePercent(percentage * 100d);
        }

        if (scoreElement.TryGetProperty("current", out JsonElement currentElement)
            && currentElement.TryGetDouble(out double current)
            && scoreElement.TryGetProperty("max", out JsonElement maxElement)
            && maxElement.TryGetDouble(out double max)
            && max > 0d)
        {
            return ClampSecureScorePercent(current / max * 100d);
        }

        return null;
    }

    private static int ClampSecureScorePercent(double percent)
    {
        if (double.IsNaN(percent) || double.IsInfinity(percent))
        {
            return 0;
        }

        if (percent < 0d)
        {
            return 0;
        }

        if (percent > 100d)
        {
            return 100;
        }

        return (int)Math.Round(percent, MidpointRounding.AwayFromZero);
    }

    private async Task<IReadOnlyList<HostedAzureArmPolicyAssignmentRecord>> ListPolicyAssignmentsAtRestPathAsync(
        string accessToken,
        string initialUrl,
        string scopeKey,
        bool validateSubscriptionNextLink,
        CancellationToken cancellationToken)
    {
        List<HostedAzureArmPolicyAssignmentRecord> assignments = [];
        string? nextLink = initialUrl;
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                throw new InvalidOperationException(
                    "Hosted Azure extractor stopped ARM policy assignment listing due to repeating nextLink.");
            }

            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                throw new InvalidOperationException(
                    $"Hosted Azure extractor stopped ARM policy assignment listing after {MaxPaginationRequests} pages.");
            }

            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage response =
                await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug(
                        "Hosted Azure extractor skipped policy assignment listing for scope {ScopeKey}; HTTP {StatusCode}.",
                        scopeKey,
                        (int)response.StatusCode);
                }

                break;
            }

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

            using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            if (document.RootElement.TryGetProperty("value", out JsonElement valueElement)
                && valueElement.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement item in valueElement.EnumerateArray())
                {
                    HostedAzureArmPolicyAssignmentRecord? mapped = MapPolicyAssignment(item);

                    if (mapped is not null)
                    {
                        assignments.Add(mapped);
                    }
                }
            }

            nextLink = null;

            if (document.RootElement.TryGetProperty("nextLink", out JsonElement nextLinkElement)
                && nextLinkElement.ValueKind == JsonValueKind.String)
            {
                string? candidateNextLink = nextLinkElement.GetString();

                if (!string.IsNullOrWhiteSpace(candidateNextLink))
                {
                    if (validateSubscriptionNextLink)
                    {
                        HostedAzureArmNextLinkValidator.EnsureTargetsSubscription(candidateNextLink, scopeKey);
                    }
                    else
                    {
                        HostedAzureArmNextLinkValidator.EnsureTargetsManagementGroup(candidateNextLink, scopeKey);
                    }

                    nextLink = candidateNextLink;
                }
            }
        }

        return assignments;
    }

    private async Task<IReadOnlyList<HostedAzureArmDiagnosticSettingRecord>> ListDiagnosticSettingsForResourceAsync(
        string accessToken,
        string resourceId,
        CancellationToken cancellationToken)
    {
        List<HostedAzureArmDiagnosticSettingRecord> settings = [];
        string? nextLink =
            $"https://management.azure.com/{resourceId.Trim()}/providers/Microsoft.Insights/diagnosticSettings?api-version={DiagnosticSettingsApiVersion}";
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                break;
            }

            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug(
                        "Hosted Azure extractor stopped diagnostic setting listing for resource {ResourceId} after {MaxPages} pages.",
                        resourceId,
                        MaxPaginationRequests);
                }

                break;
            }

            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage response =
                await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug(
                        "Hosted Azure extractor skipped diagnostic settings for resource {ResourceId}; HTTP {StatusCode}.",
                        resourceId,
                        (int)response.StatusCode);
                }

                break;
            }

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

            using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            if (document.RootElement.TryGetProperty("value", out JsonElement valueElement)
                && valueElement.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement item in valueElement.EnumerateArray())
                {
                    HostedAzureArmDiagnosticSettingRecord? mapped = MapDiagnosticSetting(item, resourceId);

                    if (mapped is not null)
                    {
                        settings.Add(mapped);
                    }
                }
            }

            nextLink = null;

            if (document.RootElement.TryGetProperty("nextLink", out JsonElement nextLinkElement)
                && nextLinkElement.ValueKind == JsonValueKind.String)
            {
                nextLink = nextLinkElement.GetString();
            }
        }

        return settings;
    }

    private static HostedAzureArmPolicyAssignmentRecord? MapPolicyAssignment(JsonElement item)
    {
        if (!item.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        string? scope = TryGetStringValue(propertiesElement, "scope");
        string? policyDefinitionId = TryGetStringValue(propertiesElement, "policyDefinitionId")
                                     ?? TryGetStringValue(propertiesElement, "policySetDefinitionId");

        if (string.IsNullOrWhiteSpace(scope) || string.IsNullOrWhiteSpace(policyDefinitionId))
        {
            return null;
        }

        return new HostedAzureArmPolicyAssignmentRecord(
            scope.Trim(),
            policyDefinitionId.Trim(),
            TryGetStringValue(item, "name"),
            TryGetStringValue(item, "id"));
    }

    private static HostedAzureArmDiagnosticSettingRecord? MapDiagnosticSetting(JsonElement item, string targetResourceId)
    {
        string? name = TryGetStringValue(item, "name");

        if (string.IsNullOrWhiteSpace(name))
        {
            return null;
        }

        if (!item.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        string? workspaceId = TryGetStringValue(propertiesElement, "workspaceId");

        if (string.IsNullOrWhiteSpace(workspaceId)
            && propertiesElement.TryGetProperty("workspaces", out JsonElement workspacesElement)
            && workspacesElement.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement workspace in workspacesElement.EnumerateArray())
            {
                workspaceId = TryGetStringValue(workspace, "workspaceResourceId");

                if (!string.IsNullOrWhiteSpace(workspaceId))
                {
                    break;
                }
            }
        }

        if (string.IsNullOrWhiteSpace(workspaceId))
        {
            return null;
        }

        return new HostedAzureArmDiagnosticSettingRecord(
            targetResourceId.Trim(),
            name.Trim(),
            workspaceId.Trim());
    }

    public async Task<IReadOnlyList<HostedAzureArmFederatedCredentialRecord>> ListFederatedCredentialsAsync(
        string accessToken,
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentNullException.ThrowIfNull(resources);

        List<HostedAzureArmFederatedCredentialRecord> credentials = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (!resource.ResourceType.Contains("userAssignedIdentities", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string? principalId = TryReadProperty(resource.Properties, "principalId");

            if (string.IsNullOrWhiteSpace(principalId))
            {
                continue;
            }

            string? clientId = TryReadProperty(resource.Properties, "clientId");
            IReadOnlyList<HostedAzureArmFederatedCredentialRecord> identityCredentials =
                await ListFederatedCredentialsForIdentityAsync(
                    accessToken,
                    resource.ResourceId,
                    principalId.Trim(),
                    clientId,
                    cancellationToken).ConfigureAwait(false);

            foreach (HostedAzureArmFederatedCredentialRecord credential in identityCredentials)
            {
                string key = $"{credential.Issuer}|{credential.Subject}|{credential.PrincipalId}";

                if (keys.Add(key))
                {
                    credentials.Add(credential);
                }
            }
        }

        if (_logger.IsEnabled(LogLevel.Debug))
        {
            _logger.LogDebug(
                "Hosted Azure extractor listed {Count} federated credentials across user-assigned identities.",
                credentials.Count);
        }

        return credentials;
    }

    private async Task<IReadOnlyList<HostedAzureArmFederatedCredentialRecord>> ListFederatedCredentialsForIdentityAsync(
        string accessToken,
        string identityResourceId,
        string principalId,
        string? clientId,
        CancellationToken cancellationToken)
    {
        List<HostedAzureArmFederatedCredentialRecord> credentials = [];
        string? nextLink =
            $"https://management.azure.com/{identityResourceId.Trim()}/federatedIdentityCredentials?api-version={FederatedCredentialsApiVersion}";
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                break;
            }

            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                _logger.LogWarning(
                    "Hosted Azure extractor stopped federated credential listing for identity {IdentityResourceId} after {MaxPages} pages.",
                    identityResourceId,
                    MaxPaginationRequests);
                break;
            }

            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage response =
                await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug(
                        "Hosted Azure extractor skipped federated credentials for identity {IdentityResourceId}; HTTP {StatusCode}.",
                        identityResourceId,
                        (int)response.StatusCode);
                }

                break;
            }

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

            using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            if (document.RootElement.TryGetProperty("value", out JsonElement valueElement)
                && valueElement.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement item in valueElement.EnumerateArray())
                {
                    HostedAzureArmFederatedCredentialRecord? mapped =
                        MapFederatedCredential(item, identityResourceId, principalId, clientId);

                    if (mapped is not null)
                    {
                        credentials.Add(mapped);
                    }
                }
            }

            nextLink = null;

            if (document.RootElement.TryGetProperty("nextLink", out JsonElement nextLinkElement)
                && nextLinkElement.ValueKind == JsonValueKind.String)
            {
                nextLink = nextLinkElement.GetString();
            }
        }

        return credentials;
    }

    private static HostedAzureArmFederatedCredentialRecord? MapFederatedCredential(
        JsonElement item,
        string parentResourceId,
        string principalId,
        string? clientId)
    {
        if (!item.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        string? issuer = TryGetStringValue(propertiesElement, "issuer");
        string? subject = TryGetStringValue(propertiesElement, "subject");

        if (string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(subject))
        {
            return null;
        }

        string? credentialName = TryGetStringValue(item, "name");

        return new HostedAzureArmFederatedCredentialRecord(
            issuer.Trim(),
            subject.Trim(),
            principalId,
            clientId,
            parentResourceId.Trim(),
            credentialName);
    }

    private static string? TryReadProperty(IReadOnlyDictionary<string, object?>? properties, string propertyName)
    {
        if (properties is null
            || !properties.TryGetValue(propertyName, out object? value)
            || value is null)
        {
            return null;
        }

        string? text = value.ToString();

        return string.IsNullOrWhiteSpace(text) ? null : text;
    }

    private static HostedAzureArmRoleAssignmentRecord? MapRoleAssignment(JsonElement item)
    {
        if (!item.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        string? scope = TryGetStringValue(propertiesElement, "scope");
        string? principalId = TryGetStringValue(propertiesElement, "principalId");
        string? roleDefinitionId = TryGetStringValue(propertiesElement, "roleDefinitionId");

        if (string.IsNullOrWhiteSpace(scope)
            || string.IsNullOrWhiteSpace(principalId)
            || string.IsNullOrWhiteSpace(roleDefinitionId))
        {
            return null;
        }

        return new HostedAzureArmRoleAssignmentRecord(
            scope.Trim(),
            principalId.Trim(),
            TryGetStringValue(propertiesElement, "principalType"),
            roleDefinitionId.Trim());
    }

    private static HostedAzureArmRoleAssignmentRecord? MapRoleEligibilitySchedule(JsonElement item)
    {
        if (!item.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        string? scope = TryGetStringValue(propertiesElement, "scope");
        string? principalId = TryGetStringValue(propertiesElement, "principalId");
        string? roleDefinitionId = TryGetStringValue(propertiesElement, "roleDefinitionId");

        if (string.IsNullOrWhiteSpace(scope)
            || string.IsNullOrWhiteSpace(principalId)
            || string.IsNullOrWhiteSpace(roleDefinitionId))
        {
            return null;
        }

        return new HostedAzureArmRoleAssignmentRecord(
            scope.Trim(),
            principalId.Trim(),
            TryGetStringValue(propertiesElement, "principalType"),
            roleDefinitionId.Trim(),
            PimEligibilityKind: "eligible");
    }

    private void LogSkippedArmRow(JsonElement item)
    {
        if (!_logger.IsEnabled(LogLevel.Warning))
            return;

        string? resourceId = TryGetStringValue(item, "id");
        string? resourceType = TryGetStringValue(item, "type");

        _logger.LogWarning(
            "Hosted Azure extractor skipped ARM resource row missing id or type. Id={ResourceId}, Type={ResourceType}",
            resourceId,
            resourceType);
    }

    private static HostedAzureArmResourceRecord? MapResource(JsonElement item)
    {
        if (!TryGetString(item, "id", out string? resourceId) ||
            !TryGetString(item, "type", out string? resourceType))
        {
            return null;
        }

        string name = TryGetString(item, "name", out string? parsedName)
            ? parsedName!
            : resourceId!;

        string? location = TryGetString(item, "location", out string? parsedLocation)
            ? parsedLocation
            : null;

        object? sku = item.TryGetProperty("sku", out JsonElement skuElement)
            ? JsonSerializer.Deserialize<object>(skuElement.GetRawText())
            : null;

        Dictionary<string, string>? tags = null;

        if (item.TryGetProperty("tags", out JsonElement tagsElement) &&
            tagsElement.ValueKind == JsonValueKind.Object)
        {
            tags = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (JsonProperty tag in tagsElement.EnumerateObject())
            {
                if (tag.Value.ValueKind == JsonValueKind.Null)
                {
                    tags[tag.Name] = string.Empty;
                    continue;
                }

                if (tag.Value.ValueKind == JsonValueKind.String)
                    tags[tag.Name] = tag.Value.GetString() ?? string.Empty;
            }
        }

        Dictionary<string, object?> properties = BuildProperties(item, resourceType!);

        if (item.TryGetProperty("properties", out JsonElement propertiesElement)
            && propertiesElement.ValueKind == JsonValueKind.Object)
        {
            HostedAzureInventoryResourcePropertyExpander.Expand(resourceType!, propertiesElement, properties);
        }

        return new HostedAzureArmResourceRecord(
            resourceType!,
            resourceId!,
            name,
            location,
            sku,
            tags,
            properties);
    }

    private static Dictionary<string, object?> BuildProperties(JsonElement item, string resourceType)
    {
        Dictionary<string, object?> properties = new(StringComparer.OrdinalIgnoreCase);

        if (!item.TryGetProperty("properties", out JsonElement propertiesElement) ||
            propertiesElement.ValueKind != JsonValueKind.Object)
        {
            return properties;
        }

        if (propertiesElement.TryGetProperty("provisioningState", out JsonElement provisioningState) &&
            provisioningState.ValueKind == JsonValueKind.String)
        {
            properties["provisioningState"] = provisioningState.GetString();
        }

        if (string.Equals(resourceType, "Microsoft.Compute/virtualMachines", StringComparison.OrdinalIgnoreCase) &&
            propertiesElement.TryGetProperty("hardwareProfile", out JsonElement hardwareProfile) &&
            hardwareProfile.ValueKind == JsonValueKind.Object &&
            hardwareProfile.TryGetProperty("vmSize", out JsonElement vmSize) &&
            vmSize.ValueKind == JsonValueKind.String)
        {
            properties["vmSize"] = vmSize.GetString();
        }

        return properties;
    }

    private static bool TryGetString(JsonElement item, string propertyName, out string? value)
    {
        value = TryGetStringValue(item, propertyName);

        return value is not null;
    }

    private static string? TryGetStringValue(JsonElement item, string propertyName)
    {
        if (!item.TryGetProperty(propertyName, out JsonElement element) ||
            element.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        string? parsed = element.GetString();

        return string.IsNullOrWhiteSpace(parsed) ? null : parsed;
    }
}
