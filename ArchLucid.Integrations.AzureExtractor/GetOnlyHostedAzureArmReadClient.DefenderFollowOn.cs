using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed partial class GetOnlyHostedAzureArmReadClient
{
    private const string DefenderGovernanceApiVersion = "2022-01-01-preview";

    private const string DefenderComplianceApiVersion = "2019-01-01-preview";

    private const string DefenderAlertsApiVersion = "2022-01-01";

    private const string DefenderAttackPathsApiVersion = "2024-01-01";

    private const string DefenderSubAssessmentsApiVersion = "2019-01-01-preview";

    private const int DefenderGovernanceRowCap = 4000;

    private const int DefenderGovernanceAssessmentWalkCap = 40;

    private const int DefenderComplianceControlCap = 500;

    private const int DefenderAlertRowCap = 500;

    private const int DefenderAttackPathRowCap = 200;

    private const int DefenderVulnerabilityFindingCap = 1000;

    public async Task<HostedAzureDefenderFollowOnCollectResult> CollectSubscriptionDefenderFollowOnAsync(
        string accessToken,
        string subscriptionId,
        IReadOnlyList<HostedAzureArmDefenderPricingRecord>? pricings,
        IReadOnlyList<string>? assessmentKeys,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        string trimmedSubscriptionId = subscriptionId.Trim();
        List<string> warnings = [];
        List<HostedAzureArmDefenderGovernanceRecord> governance = [];
        List<HostedAzureArmDefenderComplianceStandardRecord> standards = [];
        List<HostedAzureArmDefenderComplianceControlRecord> controls = [];
        List<HostedAzureArmDefenderAlertRecord> alerts = [];
        List<HostedAzureArmDefenderAttackPathRecord> attackPaths = [];
        List<HostedAzureArmDefenderVulnerabilityCountRecord> vulnerabilityCounts = [];
        List<HostedAzureArmDefenderVulnerabilityFindingRecord> vulnerabilityFindings = [];

        try
        {
            await ReadDefenderGovernanceAsync(
                accessToken,
                trimmedSubscriptionId,
                assessmentKeys ?? [],
                governance,
                warnings,
                cancellationToken).ConfigureAwait(false);
            await ReadDefenderComplianceAsync(
                accessToken,
                trimmedSubscriptionId,
                standards,
                controls,
                warnings,
                cancellationToken).ConfigureAwait(false);
            await ReadDefenderAlertsAsync(
                accessToken,
                trimmedSubscriptionId,
                alerts,
                warnings,
                cancellationToken).ConfigureAwait(false);
            await ReadDefenderAttackPathsAsync(
                accessToken,
                trimmedSubscriptionId,
                pricings ?? [],
                attackPaths,
                warnings,
                cancellationToken).ConfigureAwait(false);
            await ReadDefenderVulnerabilitiesAsync(
                accessToken,
                trimmedSubscriptionId,
                vulnerabilityCounts,
                vulnerabilityFindings,
                warnings,
                cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (InvalidOperationException)
        {
            warnings.Add("defender-companions-rejected-next-link");
        }

        return new HostedAzureDefenderFollowOnCollectResult
        {
            GovernanceAssignments = governance,
            ComplianceStandards = standards,
            ComplianceControls = controls,
            Alerts = alerts,
            AttackPaths = attackPaths,
            VulnerabilityCounts = vulnerabilityCounts,
            VulnerabilityFindings = vulnerabilityFindings,
            Warnings = warnings,
        };
    }

    private async Task ReadDefenderGovernanceAsync(
        string accessToken,
        string subscriptionId,
        IReadOnlyList<string> assessmentKeys,
        List<HostedAzureArmDefenderGovernanceRecord> governance,
        List<string> warnings,
        CancellationToken cancellationToken)
    {
        bool truncated = false;
        bool failed = false;
        string listingPath = $"subscriptions/{subscriptionId}/providers/Microsoft.Security/governanceAssignments";

        bool pageTruncated = await ReadDefenderPagesAsync(
            accessToken,
            subscriptionId,
            listingPath,
            DefenderGovernanceApiVersion,
            "defender-governance.json",
            warnings,
            item => TryAddGovernance(subscriptionId, item, governance, ref truncated),
            () => failed = true,
            cancellationToken).ConfigureAwait(false);

        if (failed && governance.Count == 0)
        {
            int removed = warnings.RemoveAll(static warning =>
                warning.Contains("defender-governance.json", StringComparison.Ordinal)
                && warning.Contains("HTTP 404", StringComparison.Ordinal));

            if (removed == 0)
            {
                governance.Clear();
                return;
            }

            await ReadGovernanceForAssessmentsAsync(
                accessToken,
                subscriptionId,
                assessmentKeys,
                governance,
                warnings,
                cancellationToken).ConfigureAwait(false);
            return;
        }

        if (truncated || pageTruncated)
        {
            warnings.Add("defender-governance-truncated");
        }
    }

    private async Task ReadGovernanceForAssessmentsAsync(
        string accessToken,
        string subscriptionId,
        IReadOnlyList<string> assessmentKeys,
        List<HostedAzureArmDefenderGovernanceRecord> governance,
        List<string> warnings,
        CancellationToken cancellationToken)
    {
        List<string> keys = assessmentKeys
            .Where(static key => !string.IsNullOrWhiteSpace(key))
            .Select(static key => key.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (keys.Count == 0)
        {
            warnings.Add("defender-governance.json collection failed; HTTP 404; api-version 2022-01-01-preview");
            return;
        }

        bool truncated = keys.Count > DefenderGovernanceAssessmentWalkCap;
        int misses = 0;

        foreach (string assessmentKey in keys.Take(DefenderGovernanceAssessmentWalkCap))
        {
            int before = governance.Count;
            int warningStart = warnings.Count;
            bool failed = false;
            string listingPath =
                $"subscriptions/{subscriptionId}/providers/Microsoft.Security/assessments/{Uri.EscapeDataString(assessmentKey)}/governanceAssignments";

            bool pageTruncated = await ReadDefenderPagesAsync(
                accessToken,
                subscriptionId,
                listingPath,
                DefenderGovernanceApiVersion,
                "defender-governance.json",
                warnings,
                item => TryAddGovernance(subscriptionId, item, governance, ref truncated),
                () => failed = true,
                cancellationToken).ConfigureAwait(false);

            if (pageTruncated)
            {
                truncated = true;
            }

            if (failed && governance.Count == before)
            {
                if (warnings.Count > warningStart)
                {
                    warnings.RemoveRange(warningStart, warnings.Count - warningStart);
                }

                misses++;

                if (misses >= 3)
                {
                    warnings.Add("defender-governance.json collection failed; HTTP 404; api-version 2022-01-01-preview");
                    break;
                }
            }
            else
            {
                misses = 0;
            }
        }

        if (truncated)
        {
            warnings.Add("defender-governance-truncated");
        }
    }

    private static void TryAddGovernance(
        string subscriptionId,
        JsonElement item,
        List<HostedAzureArmDefenderGovernanceRecord> governance,
        ref bool truncated)
    {
        if (governance.Count >= DefenderGovernanceRowCap)
        {
            truncated = true;
            return;
        }

        if (!TryGetProperties(item, out JsonElement properties)
            || !TrySplitGovernanceScope(item, out string assessmentKey, out string resourceId))
        {
            return;
        }

        string owner = TryReadString(properties, "owner").Trim();

        governance.Add(new HostedAzureArmDefenderGovernanceRecord
        {
            SubscriptionId = subscriptionId,
            AssessmentKey = Truncate(assessmentKey, 128),
            ResourceId = ArmResourceIdNormalizer.Normalize(resourceId),
            Owner = string.IsNullOrWhiteSpace(owner) ? null : Truncate(owner, 320),
            RemediationDueUtc = TryReadUtc(properties, "remediationDueDate"),
            IsGracePeriod = TryReadBool(properties, "isGracePeriod"),
            AssignmentStatus = Truncate(TryReadString(properties, "assignmentStatus"), 64),
        });
    }

    private async Task ReadDefenderComplianceAsync(
        string accessToken,
        string subscriptionId,
        List<HostedAzureArmDefenderComplianceStandardRecord> standards,
        List<HostedAzureArmDefenderComplianceControlRecord> controls,
        List<string> warnings,
        CancellationToken cancellationToken)
    {
        bool failed = false;
        string listingPath = $"subscriptions/{subscriptionId}/providers/Microsoft.Security/regulatoryComplianceStandards";

        bool pageTruncated = await ReadDefenderPagesAsync(
            accessToken,
            subscriptionId,
            listingPath,
            DefenderComplianceApiVersion,
            "defender-compliance-standards.json",
            warnings,
            item =>
            {
                HostedAzureArmDefenderComplianceStandardRecord? standard = TryReadComplianceStandard(subscriptionId, item);

                if (standard is not null)
                {
                    standards.Add(standard);
                }
            },
            () => failed = true,
            cancellationToken).ConfigureAwait(false);

        if (failed && standards.Count == 0)
        {
            controls.Clear();
            return;
        }

        bool controlTruncated = false;

        foreach (HostedAzureArmDefenderComplianceStandardRecord standard in standards)
        {
            if (!string.Equals(standard.State, "Failed", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (controls.Count >= DefenderComplianceControlCap)
            {
                controlTruncated = true;
                break;
            }

            string controlPath =
                $"subscriptions/{subscriptionId}/providers/Microsoft.Security/regulatoryComplianceStandards/{Uri.EscapeDataString(standard.StandardName)}/regulatoryComplianceControls";

            bool controlPageTruncated = await ReadDefenderPagesAsync(
                accessToken,
                subscriptionId,
                controlPath,
                DefenderComplianceApiVersion,
                "defender-compliance-standards.json",
                warnings,
                item => TryAddFailedComplianceControl(subscriptionId, standard.StandardName, item, controls, ref controlTruncated),
                static () => { },
                cancellationToken).ConfigureAwait(false);

            if (controlPageTruncated)
            {
                controlTruncated = true;
            }
        }

        if (pageTruncated || controlTruncated)
        {
            warnings.Add("defender-compliance-truncated");
        }
    }

    private static HostedAzureArmDefenderComplianceStandardRecord? TryReadComplianceStandard(
        string subscriptionId,
        JsonElement item)
    {
        string? name = TryReadName(item);

        if (string.IsNullOrWhiteSpace(name) || !TryGetProperties(item, out JsonElement properties))
        {
            return null;
        }

        return new HostedAzureArmDefenderComplianceStandardRecord
        {
            SubscriptionId = subscriptionId,
            StandardName = Truncate(name, 128),
            State = Truncate(TryReadString(properties, "state"), 64),
            PassedControlCount = TryReadInt(properties, "passedControls"),
            FailedControlCount = TryReadInt(properties, "failedControls"),
            SkippedControlCount = TryReadInt(properties, "skippedControls"),
        };
    }

    private static void TryAddFailedComplianceControl(
        string subscriptionId,
        string standardName,
        JsonElement item,
        List<HostedAzureArmDefenderComplianceControlRecord> controls,
        ref bool truncated)
    {
        if (controls.Count >= DefenderComplianceControlCap)
        {
            truncated = true;
            return;
        }

        string? name = TryReadName(item);

        if (string.IsNullOrWhiteSpace(name) || !TryGetProperties(item, out JsonElement properties))
        {
            return;
        }

        string state = TryReadString(properties, "state");

        if (!string.Equals(state, "Failed", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        controls.Add(new HostedAzureArmDefenderComplianceControlRecord
        {
            SubscriptionId = subscriptionId,
            StandardName = standardName,
            ControlName = Truncate(name, 256),
            State = "Failed",
            FailedAssessmentCount = TryReadInt(properties, "failedAssessments"),
        });
    }

    private async Task ReadDefenderAlertsAsync(
        string accessToken,
        string subscriptionId,
        List<HostedAzureArmDefenderAlertRecord> alerts,
        List<string> warnings,
        CancellationToken cancellationToken)
    {
        List<HostedAzureArmDefenderAlertRecord> collected = [];
        bool failed = false;
        string listingPath = $"subscriptions/{subscriptionId}/providers/Microsoft.Security/alerts";

        bool pageTruncated = await ReadDefenderPagesAsync(
            accessToken,
            subscriptionId,
            listingPath,
            DefenderAlertsApiVersion,
            "defender-alerts.json",
            warnings,
            item =>
            {
                HostedAzureArmDefenderAlertRecord? alert = TryReadActiveAlert(subscriptionId, item);

                if (alert is not null)
                {
                    collected.Add(alert);
                }
            },
            () => failed = true,
            cancellationToken).ConfigureAwait(false);

        if (failed && collected.Count == 0)
        {
            return;
        }

        if (pageTruncated || collected.Count > DefenderAlertRowCap)
        {
            warnings.Add("defender-alerts-truncated");
        }

        alerts.AddRange(collected
            .OrderBy(static alert => AlertSeverityRank(alert.Severity))
            .ThenByDescending(static alert => alert.StartTimeUtc ?? DateTime.MinValue)
            .Take(DefenderAlertRowCap));
    }

    private static HostedAzureArmDefenderAlertRecord? TryReadActiveAlert(string subscriptionId, JsonElement item)
    {
        if (!TryGetProperties(item, out JsonElement properties))
        {
            return null;
        }

        string status = CanonicalAlertStatus(TryReadString(properties, "status"));

        if (status.Length == 0)
        {
            return null;
        }

        string? alertId = TryReadName(item);

        if (string.IsNullOrWhiteSpace(alertId))
        {
            alertId = TryReadString(item, "id");
        }

        if (string.IsNullOrWhiteSpace(alertId))
        {
            return null;
        }

        return new HostedAzureArmDefenderAlertRecord
        {
            SubscriptionId = subscriptionId,
            AlertId = Truncate(alertId, 128),
            DisplayName = Truncate(TryReadString(properties, "alertDisplayName"), 512),
            Severity = CanonicalAlertSeverity(TryReadString(properties, "severity")),
            Status = status,
            Intent = Truncate(TryReadString(properties, "intent"), 64),
            AlertType = Truncate(TryReadString(properties, "alertType"), 256),
            StartTimeUtc = TryReadUtc(properties, "startTimeUtc"),
            ResourceId = ReadAzureAlertResourceId(properties),
        };
    }

    private async Task ReadDefenderAttackPathsAsync(
        string accessToken,
        string subscriptionId,
        IReadOnlyList<HostedAzureArmDefenderPricingRecord> pricings,
        List<HostedAzureArmDefenderAttackPathRecord> attackPaths,
        List<string> warnings,
        CancellationToken cancellationToken)
    {
        if (ShouldSkipAttackPaths(pricings))
        {
            warnings.Add("defender-attack-paths-skipped-plan-off");
            return;
        }

        bool truncated = false;
        bool failed = false;
        string listingPath = $"subscriptions/{subscriptionId}/providers/Microsoft.Security/attackPaths";

        bool pageTruncated = await ReadDefenderPagesAsync(
            accessToken,
            subscriptionId,
            listingPath,
            DefenderAttackPathsApiVersion,
            "defender-attack-paths.json",
            warnings,
            item => TryAddAttackPath(subscriptionId, item, attackPaths, ref truncated),
            () => failed = true,
            cancellationToken).ConfigureAwait(false);

        if (failed && attackPaths.Count == 0)
        {
            attackPaths.Clear();
            return;
        }

        if (truncated || pageTruncated)
        {
            warnings.Add("defender-attack-paths-truncated");
        }
    }

    private static void TryAddAttackPath(
        string subscriptionId,
        JsonElement item,
        List<HostedAzureArmDefenderAttackPathRecord> attackPaths,
        ref bool truncated)
    {
        if (attackPaths.Count >= DefenderAttackPathRowCap)
        {
            truncated = true;
            return;
        }

        if (!TryGetProperties(item, out JsonElement properties))
        {
            return;
        }

        string? attackPathId = TryReadName(item);

        if (string.IsNullOrWhiteSpace(attackPathId))
        {
            return;
        }

        List<string> entryIds = ReadAttackEndpointIds(properties, "entryPointEntityInternalID", "entryPointEntityInformation", "entryPoint");
        List<string> targetIds = ReadAttackEndpointIds(properties, "targetEntityInternalID", "targetEntityInformation", "target");
        bool idListTruncated = false;
        string entryText = JoinResourceIds(entryIds, ref idListTruncated);
        string targetText = JoinResourceIds(targetIds, ref idListTruncated);

        if (entryText.Length == 0 && targetText.Length == 0)
        {
            return;
        }

        if (idListTruncated)
        {
            truncated = true;
        }

        attackPaths.Add(new HostedAzureArmDefenderAttackPathRecord
        {
            SubscriptionId = subscriptionId,
            AttackPathId = Truncate(attackPathId, 128),
            DisplayName = Truncate(TryReadString(properties, "displayName"), 512),
            RiskLevel = Truncate(TryReadString(properties, "riskLevel"), 64),
            EntryResourceIds = entryText,
            TargetResourceIds = targetText,
        });
    }

    private async Task ReadDefenderVulnerabilitiesAsync(
        string accessToken,
        string subscriptionId,
        List<HostedAzureArmDefenderVulnerabilityCountRecord> counts,
        List<HostedAzureArmDefenderVulnerabilityFindingRecord> findings,
        List<string> warnings,
        CancellationToken cancellationToken)
    {
        Dictionary<string, VulnerabilityCountAccumulator> accumulators = new(StringComparer.Ordinal);
        bool findingTruncated = false;
        bool failed = false;
        string listingPath = $"subscriptions/{subscriptionId}/providers/Microsoft.Security/subAssessments";

        bool pageTruncated = await ReadDefenderPagesAsync(
            accessToken,
            subscriptionId,
            listingPath,
            DefenderSubAssessmentsApiVersion,
            "defender-vulnerability-counts.json",
            warnings,
            item => AddVulnerability(subscriptionId, item, accumulators, findings, ref findingTruncated),
            () => failed = true,
            cancellationToken).ConfigureAwait(false);

        if (failed && accumulators.Count == 0)
        {
            findings.Clear();
            return;
        }

        if (pageTruncated || findingTruncated)
        {
            warnings.Add("defender-vulnerability-truncated");
        }

        foreach ((string resourceId, VulnerabilityCountAccumulator accumulator) in accumulators.OrderBy(static pair => pair.Key, StringComparer.Ordinal))
        {
            counts.Add(new HostedAzureArmDefenderVulnerabilityCountRecord
            {
                SubscriptionId = subscriptionId,
                ResourceId = resourceId,
                CriticalCount = accumulator.Critical,
                HighCount = accumulator.High,
                MediumCount = accumulator.Medium,
                LowCount = accumulator.Low,
            });
        }
    }

    private static void AddVulnerability(
        string subscriptionId,
        JsonElement item,
        Dictionary<string, VulnerabilityCountAccumulator> accumulators,
        List<HostedAzureArmDefenderVulnerabilityFindingRecord> findings,
        ref bool findingTruncated)
    {
        if (!TryGetProperties(item, out JsonElement properties))
        {
            return;
        }

        string resourceId = ReadSubAssessmentResourceId(properties);

        if (resourceId.Length == 0)
        {
            return;
        }

        string severity = CanonicalVulnerabilitySeverity(ReadSubAssessmentSeverity(properties));

        if (severity.Length == 0)
        {
            return;
        }

        if (!accumulators.TryGetValue(resourceId, out VulnerabilityCountAccumulator? accumulator))
        {
            accumulator = new VulnerabilityCountAccumulator();
            accumulators.Add(resourceId, accumulator);
        }

        switch (severity)
        {
            case "Critical":
                accumulator.Critical++;
                break;
            case "High":
                accumulator.High++;
                break;
            case "Medium":
                accumulator.Medium++;
                break;
            default:
                accumulator.Low++;
                break;
        }

        if (severity is not ("Critical" or "High"))
        {
            return;
        }

        if (findings.Count >= DefenderVulnerabilityFindingCap)
        {
            findingTruncated = true;
            return;
        }

        findings.Add(new HostedAzureArmDefenderVulnerabilityFindingRecord
        {
            SubscriptionId = subscriptionId,
            ResourceId = resourceId,
            Severity = severity,
            FindingId = Truncate(ReadFindingId(item, properties), 64),
            DisplayName = Truncate(TryReadString(properties, "displayName"), 240),
        });
    }

    private static bool ShouldSkipAttackPaths(IReadOnlyList<HostedAzureArmDefenderPricingRecord> pricings)
    {
        List<HostedAzureArmDefenderPricingRecord> cspm = pricings
            .Where(static pricing =>
                string.Equals(pricing.PricingName, "CloudPosture", StringComparison.OrdinalIgnoreCase)
                || string.Equals(pricing.PricingName, "DefenderCspm", StringComparison.OrdinalIgnoreCase))
            .ToList();

        return cspm.Count > 0
            && cspm.All(static pricing => string.Equals(pricing.Tier, "Free", StringComparison.OrdinalIgnoreCase));
    }

    private static bool TrySplitGovernanceScope(JsonElement item, out string assessmentKey, out string resourceId)
    {
        assessmentKey = string.Empty;
        resourceId = string.Empty;
        string fullId = TryReadString(item, "id");
        const string marker = "/providers/microsoft.security/assessments/";
        int index = fullId.IndexOf(marker, StringComparison.OrdinalIgnoreCase);

        if (index <= 0)
        {
            return false;
        }

        resourceId = fullId[..index];
        string rest = fullId[(index + marker.Length)..];
        int slash = rest.IndexOf('/');
        assessmentKey = slash < 0 ? rest : rest[..slash];

        return !string.IsNullOrWhiteSpace(assessmentKey)
            && resourceId.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase);
    }

    private static List<string> ReadAttackEndpointIds(
        JsonElement properties,
        string internalIdName,
        string informationName,
        string fallbackName)
    {
        List<string> ids = [];
        string internalId = TryReadString(properties, internalIdName);

        if (properties.TryGetProperty(informationName, out JsonElement information))
        {
            CollectArmResourceIds(information, ids, 0);
        }

        if (ids.Count == 0 && properties.TryGetProperty(fallbackName, out JsonElement fallback))
        {
            CollectArmResourceIds(fallback, ids, 0);
        }

        if (internalId.Length == 0
            || !properties.TryGetProperty("graphComponent", out JsonElement graph)
            || graph.ValueKind != JsonValueKind.Object
            || !graph.TryGetProperty("entities", out JsonElement entities)
            || entities.ValueKind != JsonValueKind.Array)
        {
            return ids;
        }

        foreach (JsonElement entity in entities.EnumerateArray())
        {
            string entityId = FirstNonEmpty(
                TryReadString(entity, "id"),
                TryReadString(entity, "entityInternalId"),
                TryReadString(entity, "entityInternalID"),
                TryReadString(entity, "internalId"));

            if (string.Equals(entityId, internalId, StringComparison.OrdinalIgnoreCase))
            {
                CollectArmResourceIds(entity, ids, 0);
            }
        }

        return ids;
    }

    private static void CollectArmResourceIds(JsonElement element, List<string> ids, int depth)
    {
        if (depth > 5)
        {
            return;
        }

        if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement child in element.EnumerateArray())
            {
                CollectArmResourceIds(child, ids, depth + 1);
            }

            return;
        }

        if (element.ValueKind != JsonValueKind.Object)
        {
            return;
        }

        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (property.Value.ValueKind == JsonValueKind.String)
            {
                string? text = property.Value.GetString();

                if (!string.IsNullOrWhiteSpace(text)
                    && text.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase)
                    && (property.NameEquals("azureResourceId")
                        || property.NameEquals("resourceId")
                        || property.NameEquals("id")))
                {
                    string normalized = ArmResourceIdNormalizer.Normalize(text);

                    if (normalized.Length > 0 && !ids.Contains(normalized, StringComparer.Ordinal))
                    {
                        ids.Add(normalized);
                    }
                }
            }
            else if (property.NameEquals("description")
                || property.NameEquals("manualRemediationSteps")
                || property.NameEquals("remediation"))
            {
                continue;
            }
            else
            {
                CollectArmResourceIds(property.Value, ids, depth + 1);
            }
        }
    }

    private static string JoinResourceIds(IReadOnlyList<string> ids, ref bool truncated)
    {
        List<string> kept = [];
        int length = 0;

        foreach (string id in ids)
        {
            int next = length == 0 ? id.Length : length + 1 + id.Length;

            if (next > 2048)
            {
                truncated = true;
                break;
            }

            kept.Add(id);
            length = next;
        }

        return string.Join(';', kept);
    }

    private static string ReadAzureAlertResourceId(JsonElement properties)
    {
        if (!properties.TryGetProperty("resourceIdentifiers", out JsonElement identifiers)
            || identifiers.ValueKind != JsonValueKind.Array)
        {
            return string.Empty;
        }

        foreach (JsonElement identifier in identifiers.EnumerateArray())
        {
            if (!string.Equals(TryReadString(identifier, "type"), "AzureResource", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string resourceId = TryReadString(identifier, "azureResourceId");

            if (!string.IsNullOrWhiteSpace(resourceId))
            {
                return ArmResourceIdNormalizer.Normalize(resourceId);
            }
        }

        return string.Empty;
    }

    private static string ReadSubAssessmentResourceId(JsonElement properties)
    {
        if (!properties.TryGetProperty("resourceDetails", out JsonElement details)
            || details.ValueKind != JsonValueKind.Object)
        {
            return string.Empty;
        }

        string resourceId = TryReadString(details, "id");

        if (string.IsNullOrWhiteSpace(resourceId)
            || !resourceId.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase))
        {
            return string.Empty;
        }

        return ArmResourceIdNormalizer.Normalize(resourceId);
    }

    private static string ReadSubAssessmentSeverity(JsonElement properties)
    {
        if (properties.TryGetProperty("status", out JsonElement status) && status.ValueKind == JsonValueKind.Object)
        {
            string severity = TryReadString(status, "severity");

            if (!string.IsNullOrWhiteSpace(severity))
            {
                return severity;
            }
        }

        return TryReadString(properties, "severity");
    }

    private static string ReadFindingId(JsonElement item, JsonElement properties)
    {
        if (properties.TryGetProperty("additionalData", out JsonElement additionalData)
            && additionalData.ValueKind == JsonValueKind.Object
            && additionalData.TryGetProperty("cve", out JsonElement cve)
            && cve.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement entry in cve.EnumerateArray())
            {
                if (entry.ValueKind == JsonValueKind.String)
                {
                    string? text = entry.GetString();

                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        return text;
                    }
                }

                if (entry.ValueKind == JsonValueKind.Object)
                {
                    string title = TryReadString(entry, "title");

                    if (!string.IsNullOrWhiteSpace(title))
                    {
                        return title;
                    }
                }
            }
        }

        string vulnerabilityId = TryReadString(properties, "id");

        if (!string.IsNullOrWhiteSpace(vulnerabilityId))
        {
            return vulnerabilityId;
        }

        return TryReadName(item) ?? string.Empty;
    }

    private static string CanonicalAlertStatus(string status)
    {
        if (status.Equals("Active", StringComparison.OrdinalIgnoreCase))
        {
            return "Active";
        }

        if (status.Equals("InProgress", StringComparison.OrdinalIgnoreCase))
        {
            return "InProgress";
        }

        return string.Empty;
    }

    private static string CanonicalAlertSeverity(string severity)
    {
        if (severity.Equals("Critical", StringComparison.OrdinalIgnoreCase)
            || severity.Equals("High", StringComparison.OrdinalIgnoreCase))
        {
            return "High";
        }

        if (severity.Equals("Medium", StringComparison.OrdinalIgnoreCase))
        {
            return "Medium";
        }

        if (severity.Equals("Low", StringComparison.OrdinalIgnoreCase))
        {
            return "Low";
        }

        if (severity.Equals("Informational", StringComparison.OrdinalIgnoreCase))
        {
            return "Informational";
        }

        return "Unknown";
    }

    private static int AlertSeverityRank(string severity) =>
        severity switch
        {
            "High" => 0,
            "Medium" => 1,
            "Low" => 2,
            "Informational" => 3,
            _ => 4,
        };

    private static string CanonicalVulnerabilitySeverity(string severity)
    {
        if (severity.Equals("Critical", StringComparison.OrdinalIgnoreCase))
        {
            return "Critical";
        }

        if (severity.Equals("High", StringComparison.OrdinalIgnoreCase))
        {
            return "High";
        }

        if (severity.Equals("Medium", StringComparison.OrdinalIgnoreCase))
        {
            return "Medium";
        }

        if (severity.Equals("Low", StringComparison.OrdinalIgnoreCase))
        {
            return "Low";
        }

        return string.Empty;
    }

    private static DateTime? TryReadUtc(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value) || value.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        if (!DateTimeOffset.TryParse(
                value.GetString(),
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out DateTimeOffset parsed))
        {
            return null;
        }

        return parsed.UtcDateTime;
    }

    private static bool TryReadBool(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return false;
        }

        if (value.ValueKind == JsonValueKind.True)
        {
            return true;
        }

        if (value.ValueKind == JsonValueKind.String
            && bool.TryParse(value.GetString(), out bool parsed))
        {
            return parsed;
        }

        return false;
    }

    private static string FirstNonEmpty(params string[] values)
    {
        foreach (string value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return string.Empty;
    }

    private sealed class VulnerabilityCountAccumulator
    {
        public int Critical { get; set; }

        public int High { get; set; }

        public int Medium { get; set; }

        public int Low { get; set; }
    }
}
