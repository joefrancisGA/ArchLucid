using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed partial class GetOnlyHostedAzureArmReadClient
{
    private const string DefenderPricingsApiVersion = "2024-01-01";

    private const string DefenderAssessmentsApiVersion = "2021-06-01";

    private const string DefenderSecurityContactsApiVersion = "2020-01-01";

    private const int DefenderAssessmentDetailCap = 4000;

    private const int DefenderScoreNameCap = 5;

    public async Task<HostedAzureDefenderCompanionCollectResult> CollectSubscriptionDefenderCompanionsAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        string trimmedSubscriptionId = subscriptionId.Trim();
        List<string> warnings = [];
        List<HostedAzureArmDefenderPricingRecord> pricings = [];
        List<HostedAzureArmDefenderScoreControlRecord> scoreControls = [];
        List<HostedAzureArmDefenderAssessmentRecord> assessments = [];
        List<HostedAzureArmDefenderAssessmentCountRecord> assessmentCounts = [];
        List<HostedAzureArmDefenderSecurityContactRecord> contacts = [];

        try
        {
            await ReadDefenderPricingsAsync(
                accessToken,
                trimmedSubscriptionId,
                pricings,
                warnings,
                cancellationToken).ConfigureAwait(false);

            await ReadDefenderScoreControlsAsync(
                accessToken,
                trimmedSubscriptionId,
                scoreControls,
                warnings,
                cancellationToken).ConfigureAwait(false);

            await ReadDefenderAssessmentsAsync(
                accessToken,
                trimmedSubscriptionId,
                assessments,
                assessmentCounts,
                warnings,
                cancellationToken).ConfigureAwait(false);

            contacts.Add(await ReadDefenderSecurityContactAsync(
                accessToken,
                trimmedSubscriptionId,
                warnings,
                cancellationToken).ConfigureAwait(false));
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (InvalidOperationException)
        {
            warnings.Add("defender-companions-rejected-next-link");
        }

        if (contacts.Count == 0)
        {
            contacts.Add(UnavailableContact(trimmedSubscriptionId));
            warnings.Add("defender-security-contacts-not-collected");
        }

        return new HostedAzureDefenderCompanionCollectResult
        {
            Pricings = pricings,
            ScoreControls = scoreControls,
            Assessments = assessments,
            AssessmentCounts = assessmentCounts,
            SecurityContacts = contacts,
            Warnings = warnings,
        };
    }

    private async Task ReadDefenderPricingsAsync(
        string accessToken,
        string subscriptionId,
        List<HostedAzureArmDefenderPricingRecord> pricings,
        List<string> warnings,
        CancellationToken cancellationToken)
    {
        string listingPath = $"subscriptions/{subscriptionId}/providers/Microsoft.Security/pricings";
        bool failed = false;

        bool pageTruncated = await ReadDefenderPagesAsync(
            accessToken,
            subscriptionId,
            listingPath,
            DefenderPricingsApiVersion,
            "defender-pricings.json",
            warnings,
            item =>
            {
                HostedAzureArmDefenderPricingRecord? row = TryReadPricing(subscriptionId, item);

                if (row is not null)
                {
                    pricings.Add(row);
                }
            },
            () => failed = true,
            cancellationToken).ConfigureAwait(false);

        if (failed)
        {
            pricings.Clear();
        }
        else if (pageTruncated)
        {
            warnings.Add("defender-pricings-truncated");
        }
    }

    private async Task ReadDefenderScoreControlsAsync(
        string accessToken,
        string subscriptionId,
        List<HostedAzureArmDefenderScoreControlRecord> scoreControls,
        List<string> warnings,
        CancellationToken cancellationToken)
    {
        List<string> scoreNames = [];
        bool scoresFailed = false;
        bool scoreNamesTruncated = false;
        string scoresPath = $"subscriptions/{subscriptionId}/providers/Microsoft.Security/secureScores";

        bool scoresPageTruncated = await ReadDefenderPagesAsync(
            accessToken,
            subscriptionId,
            scoresPath,
            SecureScoresApiVersion,
            "defender-score-controls.json",
            warnings,
            item =>
            {
                string? name = TryReadName(item);

                if (string.IsNullOrWhiteSpace(name)
                    || scoreNames.FindIndex(existing => string.Equals(existing, name, StringComparison.OrdinalIgnoreCase)) >= 0)
                {
                    return;
                }

                if (scoreNames.Count < DefenderScoreNameCap)
                {
                    scoreNames.Add(name);
                }
                else
                {
                    scoreNamesTruncated = true;
                }
            },
            () => scoresFailed = true,
            cancellationToken).ConfigureAwait(false);

        if (scoresFailed)
        {
            scoreControls.Clear();
            return;
        }

        bool controlsPageTruncated = false;

        if (scoreNames.FindIndex(name => string.Equals(name, "ascScore", StringComparison.OrdinalIgnoreCase)) < 0)
        {
            if (scoreNames.Count == DefenderScoreNameCap)
            {
                scoreNames[^1] = "ascScore";
            }
            else
            {
                scoreNames.Insert(0, "ascScore");
            }
        }

        foreach (string scoreName in scoreNames.Take(DefenderScoreNameCap))
        {
            string controlsPath =
                $"subscriptions/{subscriptionId}/providers/Microsoft.Security/secureScores/{Uri.EscapeDataString(scoreName)}/secureScoreControls";
            bool controlsFailed = false;
            int before = scoreControls.Count;

            bool controlListingPageTruncated = await ReadDefenderPagesAsync(
                accessToken,
                subscriptionId,
                controlsPath,
                SecureScoresApiVersion,
                "defender-score-controls.json",
                warnings,
                item =>
                {
                    HostedAzureArmDefenderScoreControlRecord? row = TryReadScoreControl(subscriptionId, scoreName, item);

                    if (row is not null)
                    {
                        scoreControls.Add(row);
                    }
                },
                () => controlsFailed = true,
                cancellationToken).ConfigureAwait(false);

            if (controlListingPageTruncated)
            {
                controlsPageTruncated = true;
            }

            if (controlsFailed)
            {
                scoreControls.RemoveRange(before, scoreControls.Count - before);
            }
        }

        if (scoresPageTruncated || scoreNamesTruncated || controlsPageTruncated)
        {
            warnings.Add("defender-score-controls-truncated");
        }
    }

    private async Task ReadDefenderAssessmentsAsync(
        string accessToken,
        string subscriptionId,
        List<HostedAzureArmDefenderAssessmentRecord> assessments,
        List<HostedAzureArmDefenderAssessmentCountRecord> assessmentCounts,
        List<string> warnings,
        CancellationToken cancellationToken)
    {
        Dictionary<string, AssessmentCountAccumulator> counts = new(StringComparer.OrdinalIgnoreCase);
        bool detailTruncated = false;
        bool failed = false;
        string listingPath = $"subscriptions/{subscriptionId}/providers/Microsoft.Security/assessments";

        bool pageTruncated = await ReadDefenderPagesAsync(
            accessToken,
            subscriptionId,
            listingPath,
            DefenderAssessmentsApiVersion,
            "defender-assessments.json",
            warnings,
            item =>
            {
                if (!TryReadAssessment(subscriptionId, item, out AssessmentObservation? observation) || observation is null)
                {
                    return;
                }

                AssessmentCountAccumulator accumulator = counts.GetValueOrDefault(observation.AssessmentKey)
                    ?? new AssessmentCountAccumulator(observation.DisplayName, observation.Severity);
                counts[observation.AssessmentKey] = accumulator.Add(observation.Status);

                if (!string.Equals(observation.Status, "Unhealthy", StringComparison.OrdinalIgnoreCase))
                {
                    return;
                }

                if (assessments.Count >= DefenderAssessmentDetailCap)
                {
                    detailTruncated = true;
                    return;
                }

                if (string.IsNullOrWhiteSpace(observation.ResourceId))
                {
                    return;
                }

                assessments.Add(new HostedAzureArmDefenderAssessmentRecord
                {
                    SubscriptionId = subscriptionId,
                    AssessmentKey = observation.AssessmentKey,
                    DisplayName = observation.DisplayName,
                    Severity = observation.Severity,
                    Status = "Unhealthy",
                    StatusCause = observation.StatusCause,
                    Category = observation.Category,
                    ResourceId = ArmResourceIdNormalizer.Normalize(observation.ResourceId),
                });
            },
            () => failed = true,
            cancellationToken).ConfigureAwait(false);

        if (failed)
        {
            assessments.Clear();
            return;
        }

        if (detailTruncated || pageTruncated)
        {
            warnings.Add("defender-assessments-truncated");
        }

        foreach ((string key, AssessmentCountAccumulator accumulator) in counts.OrderBy(pair => pair.Key, StringComparer.OrdinalIgnoreCase))
        {
            assessmentCounts.Add(new HostedAzureArmDefenderAssessmentCountRecord
            {
                SubscriptionId = subscriptionId,
                AssessmentKey = key,
                DisplayName = accumulator.DisplayName,
                Severity = accumulator.Severity,
                HealthyCount = accumulator.HealthyCount,
                UnhealthyCount = accumulator.UnhealthyCount,
                NotApplicableCount = accumulator.NotApplicableCount,
            });
        }
    }

    private async Task<HostedAzureArmDefenderSecurityContactRecord> ReadDefenderSecurityContactAsync(
        string accessToken,
        string subscriptionId,
        List<string> warnings,
        CancellationToken cancellationToken)
    {
        HashSet<string> emails = new(StringComparer.OrdinalIgnoreCase);
        bool alertsToAdmins = false;
        string minimalSeverity = string.Empty;
        HashSet<string> roles = new(StringComparer.OrdinalIgnoreCase);
        bool failed = false;
        bool sawContact = false;
        string listingPath = $"subscriptions/{subscriptionId}/providers/Microsoft.Security/securityContacts";

        bool pageTruncated = await ReadDefenderPagesAsync(
            accessToken,
            subscriptionId,
            listingPath,
            DefenderSecurityContactsApiVersion,
            "defender-security-contacts.json",
            warnings,
            item =>
            {
                sawContact = true;
                ReadContact(item, emails, roles, ref alertsToAdmins, ref minimalSeverity);
            },
            () => failed = true,
            cancellationToken).ConfigureAwait(false);

        if (pageTruncated)
        {
            warnings.Add("defender-security-contacts-truncated");
        }

        if (failed)
        {
            warnings.Add("defender-security-contacts-not-collected");
            return UnavailableContact(subscriptionId);
        }

        if (!sawContact || emails.Count == 0)
        {
            warnings.Add("defender-security-contact-missing");
        }

        return new HostedAzureArmDefenderSecurityContactRecord
        {
            SubscriptionId = subscriptionId,
            CollectionStatus = "Collected",
            EmailCount = emails.Count,
            Emails = Truncate(string.Join(';', emails.OrderBy(static email => email, StringComparer.OrdinalIgnoreCase)), 512),
            AlertsToAdmins = alertsToAdmins,
            MinimalSeverity = Truncate(minimalSeverity, 64),
            NotificationRoles = Truncate(string.Join(';', roles.OrderBy(static role => role, StringComparer.OrdinalIgnoreCase)), 512),
        };
    }

    private async Task<bool> ReadDefenderPagesAsync(
        string accessToken,
        string subscriptionId,
        string listingRelativePath,
        string apiVersion,
        string companionName,
        List<string> warnings,
        Action<JsonElement> onItem,
        Action onFailed,
        CancellationToken cancellationToken)
    {
        string? nextLink =
            $"https://management.azure.com/{listingRelativePath}?api-version={apiVersion}";
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;
        int accepted = 0;
        bool truncated = false;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                break;
            }

            requestCount++;

            if (ShouldBreakForPageCap(requestCount))
            {
                truncated = true;
                break;
            }

            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage response =
                await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                warnings.Add($"{companionName} collection failed; HTTP {(int)response.StatusCode}");
                if (accepted == 0)
                {
                    onFailed();
                }

                break;
            }

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

            JsonDocument? document;

            try
            {
                document = await TryParseArmPaginationPageAsync(stream, accepted, cancellationToken).ConfigureAwait(false);
            }
            catch (JsonException)
            {
                warnings.Add($"{companionName} collection failed; invalid JSON");

                if (accepted == 0)
                {
                    onFailed();
                }

                break;
            }

            if (document is null)
            {
                warnings.Add($"{companionName} collection failed; invalid JSON");

                if (accepted == 0)
                {
                    onFailed();
                }

                break;
            }

            using (document)
            {

                if (document.RootElement.TryGetProperty("value", out JsonElement valueElement)
                    && valueElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (JsonElement item in valueElement.EnumerateArray())
                    {
                        onItem(item);
                        accepted++;
                    }
                }

                nextLink = null;

                if (document.RootElement.TryGetProperty("nextLink", out JsonElement nextLinkElement)
                    && nextLinkElement.ValueKind == JsonValueKind.String)
                {
                    string? candidateNextLink = nextLinkElement.GetString();

                    if (!string.IsNullOrWhiteSpace(candidateNextLink))
                    {
                        HostedAzureArmNextLinkValidator.EnsureTargetsSubscription(candidateNextLink, subscriptionId);
                        HostedAzureArmNextLinkValidator.EnsureTargetsArmRelativeListingPath(
                            candidateNextLink,
                            listingRelativePath);
                        nextLink = candidateNextLink;
                    }
                }
            }
        }

        return truncated;
    }

    private static HostedAzureArmDefenderPricingRecord? TryReadPricing(string subscriptionId, JsonElement item)
    {
        string? name = TryReadName(item);

        if (string.IsNullOrWhiteSpace(name) || !TryGetProperties(item, out JsonElement properties))
        {
            return null;
        }

        string tier = TryReadString(properties, "pricingTier");

        if (string.IsNullOrWhiteSpace(tier))
        {
            return null;
        }

        return new HostedAzureArmDefenderPricingRecord
        {
            SubscriptionId = subscriptionId,
            PricingName = Truncate(name, 128),
            Tier = Truncate(tier, 32),
            Extensions = ReadExtensions(properties),
        };
    }

    private static HostedAzureArmDefenderScoreControlRecord? TryReadScoreControl(
        string subscriptionId,
        string scoreName,
        JsonElement item)
    {
        string? controlName = TryReadName(item);

        if (string.IsNullOrWhiteSpace(controlName) || !TryGetProperties(item, out JsonElement properties))
        {
            return null;
        }

        if (!properties.TryGetProperty("score", out JsonElement score)
            || score.ValueKind != JsonValueKind.Object
            || !TryReadScorePair(score, out int current, out int max, out int percentage))
        {
            return null;
        }

        return new HostedAzureArmDefenderScoreControlRecord
        {
            SubscriptionId = subscriptionId,
            ScoreName = Truncate(scoreName, 64),
            ControlName = Truncate(controlName, 128),
            DisplayName = Truncate(TryReadString(properties, "displayName"), 512),
            CurrentScore = current,
            MaxScore = max,
            Percentage = percentage,
            Weight = TryReadInt(properties, "weight"),
            UnhealthyResourceCount = TryReadInt(properties, "unhealthyResourceCount"),
            HealthyResourceCount = TryReadInt(properties, "healthyResourceCount"),
        };
    }

    private static bool TryReadAssessment(
        string subscriptionId,
        JsonElement item,
        out AssessmentObservation? observation)
    {
        observation = null;
        string? assessmentKey = TryReadName(item);

        if (string.IsNullOrWhiteSpace(assessmentKey) || !TryGetProperties(item, out JsonElement properties))
        {
            return false;
        }

        string status = "Unknown";
        string statusCause = string.Empty;

        if (properties.TryGetProperty("status", out JsonElement statusElement)
            && statusElement.ValueKind == JsonValueKind.Object)
        {
            string code = TryReadString(statusElement, "code");
            status = string.IsNullOrWhiteSpace(code) ? "Unknown" : code;
            statusCause = Truncate(TryReadString(statusElement, "cause"), 240);
        }

        string severity = "Unknown";
        string category = string.Empty;

        if (properties.TryGetProperty("metadata", out JsonElement metadata)
            && metadata.ValueKind == JsonValueKind.Object)
        {
            string metadataSeverity = TryReadString(metadata, "severity");

            if (!string.IsNullOrWhiteSpace(metadataSeverity))
            {
                severity = metadataSeverity;
            }

            if (metadata.TryGetProperty("categories", out JsonElement categories)
                && categories.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement categoryElement in categories.EnumerateArray())
                {
                    if (categoryElement.ValueKind == JsonValueKind.String)
                    {
                        category = categoryElement.GetString() ?? string.Empty;
                        break;
                    }
                }
            }
        }

        observation = new AssessmentObservation(
            Truncate(assessmentKey, 128),
            Truncate(TryReadString(properties, "displayName"), 512),
            Truncate(severity, 32),
            Truncate(status, 32),
            statusCause,
            Truncate(category, 128),
            TryReadAssessmentResourceId(item, properties));

        _ = subscriptionId;
        return true;
    }

    private static string? TryReadAssessmentResourceId(JsonElement item, JsonElement properties)
    {
        if (properties.TryGetProperty("resourceDetails", out JsonElement details)
            && details.ValueKind == JsonValueKind.Object)
        {
            string resourceId = TryReadString(details, "id");

            if (string.IsNullOrWhiteSpace(resourceId))
            {
                resourceId = TryReadString(details, "Id");
            }

            if (!string.IsNullOrWhiteSpace(resourceId))
            {
                return resourceId;
            }
        }

        string fullId = TryReadString(item, "id");
        const string marker = "/providers/Microsoft.Security/assessments/";
        int index = fullId.IndexOf(marker, StringComparison.OrdinalIgnoreCase);

        if (index > 0)
        {
            return fullId[..index];
        }

        return null;
    }

    private static void ReadContact(
        JsonElement item,
        HashSet<string> emails,
        HashSet<string> roles,
        ref bool alertsToAdmins,
        ref string minimalSeverity)
    {
        if (!TryGetProperties(item, out JsonElement properties))
        {
            return;
        }

        if (properties.TryGetProperty("emails", out JsonElement emailsElement))
        {
            if (emailsElement.ValueKind == JsonValueKind.String)
            {
                AddEmails(emails, emailsElement.GetString());
            }
            else if (emailsElement.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement email in emailsElement.EnumerateArray())
                {
                    if (email.ValueKind == JsonValueKind.String)
                    {
                        AddEmails(emails, email.GetString());
                    }
                }
            }
        }

        if (properties.TryGetProperty("alertNotifications", out JsonElement alerts)
            && alerts.ValueKind == JsonValueKind.Object)
        {
            if (string.Equals(TryReadString(alerts, "state"), "On", StringComparison.OrdinalIgnoreCase))
            {
                alertsToAdmins = true;
            }

            if (string.IsNullOrWhiteSpace(minimalSeverity))
            {
                minimalSeverity = TryReadString(alerts, "minimalSeverity");
            }
        }

        if (properties.TryGetProperty("notificationsByRole", out JsonElement byRole)
            && byRole.ValueKind == JsonValueKind.Object
            && byRole.TryGetProperty("roles", out JsonElement roleArray)
            && roleArray.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement role in roleArray.EnumerateArray())
            {
                if (role.ValueKind == JsonValueKind.String)
                {
                    string? roleName = role.GetString();

                    if (!string.IsNullOrWhiteSpace(roleName))
                    {
                        roles.Add(roleName.Trim());
                    }
                }
            }
        }
    }

    private static void AddEmails(HashSet<string> emails, string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return;
        }

        foreach (string part in raw.Split([';', ','], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (!string.IsNullOrWhiteSpace(part))
            {
                emails.Add(part);
            }
        }
    }

    private static string ReadExtensions(JsonElement properties)
    {
        if (!properties.TryGetProperty("extensions", out JsonElement extensions)
            || extensions.ValueKind != JsonValueKind.Array)
        {
            return string.Empty;
        }

        List<string> pairs = [];

        foreach (JsonElement extension in extensions.EnumerateArray())
        {
            if (extension.ValueKind != JsonValueKind.Object)
            {
                continue;
            }

            string name = TryReadString(extension, "name");

            if (string.IsNullOrWhiteSpace(name))
            {
                continue;
            }

            pairs.Add($"{name}={ReadEnabledFlag(extension)}");
        }

        return Truncate(string.Join(';', pairs), 512);
    }

    private static string ReadEnabledFlag(JsonElement extension)
    {
        if (!extension.TryGetProperty("isEnabled", out JsonElement enabled))
        {
            return "false";
        }

        if (enabled.ValueKind == JsonValueKind.True)
        {
            return "true";
        }

        if (enabled.ValueKind == JsonValueKind.False)
        {
            return "false";
        }

        if (enabled.ValueKind == JsonValueKind.String
            && bool.TryParse(enabled.GetString(), out bool parsed))
        {
            return parsed ? "true" : "false";
        }

        return "false";
    }

    private static bool TryReadScorePair(JsonElement score, out int current, out int max, out int percentage)
    {
        current = 0;
        max = 0;
        percentage = 0;
        bool hasCurrent = score.TryGetProperty("current", out JsonElement currentElement)
            && currentElement.TryGetDouble(out double currentValue);
        bool hasMax = score.TryGetProperty("max", out JsonElement maxElement)
            && maxElement.TryGetDouble(out double maxValue);

        if (!hasCurrent && !hasMax)
        {
            return false;
        }

        current = hasCurrent ? ClampCount(currentElement.GetDouble()) : 0;
        max = hasMax ? ClampCount(maxElement.GetDouble()) : 0;

        if (score.TryGetProperty("percentage", out JsonElement percentageElement)
            && percentageElement.TryGetDouble(out double percentageValue))
        {
            percentage = ClampSecureScorePercent(percentageValue * 100d);
            return true;
        }

        if (max > 0)
        {
            percentage = ClampSecureScorePercent(current / (double)max * 100d);
        }

        return true;
    }

    private static int TryReadInt(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement property) || !property.TryGetDouble(out double value))
        {
            return 0;
        }

        return ClampCount(value);
    }

    private static int ClampCount(double value)
    {
        if (double.IsNaN(value) || double.IsInfinity(value) || value <= 0d)
        {
            return 0;
        }

        if (value >= int.MaxValue)
        {
            return int.MaxValue;
        }

        return (int)Math.Round(value, MidpointRounding.AwayFromZero);
    }

    private static bool TryGetProperties(JsonElement item, out JsonElement properties)
    {
        if (item.ValueKind == JsonValueKind.Object
            && item.TryGetProperty("properties", out properties)
            && properties.ValueKind == JsonValueKind.Object)
        {
            return true;
        }

        properties = default;
        return false;
    }

    private static string? TryReadName(JsonElement item)
    {
        string name = TryReadString(item, "name");
        return string.IsNullOrWhiteSpace(name) ? null : name.Trim();
    }

    private static string TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement property)
            || property.ValueKind != JsonValueKind.String)
        {
            return string.Empty;
        }

        return property.GetString()?.Trim() ?? string.Empty;
    }

    private static string Truncate(string? value, int max)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        string trimmed = value.Trim();
        return trimmed.Length <= max ? trimmed : trimmed[..max];
    }

    private static HostedAzureArmDefenderSecurityContactRecord UnavailableContact(string subscriptionId) =>
        new()
        {
            SubscriptionId = subscriptionId,
            CollectionStatus = "Unavailable",
        };

    private sealed record AssessmentObservation(
        string AssessmentKey,
        string DisplayName,
        string Severity,
        string Status,
        string StatusCause,
        string Category,
        string? ResourceId);

    private sealed record AssessmentCountAccumulator(
        string DisplayName,
        string Severity,
        int HealthyCount = 0,
        int UnhealthyCount = 0,
        int NotApplicableCount = 0)
    {
        public AssessmentCountAccumulator Add(string status)
        {
            if (string.Equals(status, "Healthy", StringComparison.OrdinalIgnoreCase))
            {
                return this with { HealthyCount = HealthyCount + 1 };
            }

            if (string.Equals(status, "Unhealthy", StringComparison.OrdinalIgnoreCase))
            {
                return this with { UnhealthyCount = UnhealthyCount + 1 };
            }

            if (string.Equals(status, "NotApplicable", StringComparison.OrdinalIgnoreCase))
            {
                return this with { NotApplicableCount = NotApplicableCount + 1 };
            }

            return this;
        }
    }
}
