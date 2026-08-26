using System.Globalization;
using System.Text.Json;

using ArchLucid.ContextIngestion.Parsing;
using ArchLucid.Contracts.Persistence.Context;

namespace ArchLucid.ContextIngestion.Canonicalization;

/// <summary>
///     Expands App Service ARM network access rules into SecurityBaseline and rule nodes linked to the site.
/// </summary>
public static class AppServiceNetworkAccessSecurityBaselineExpander
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private static readonly JsonSerializerOptions TerraformJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    /// <summary>Matches <see cref="ArchLucid.KnowledgeGraph.CanonicalGraphPropertyKeys.ProtectedTopologyNodeIds"/>.</summary>
    private const string ProtectedTopologyNodeIdsKey = "protectedTopologyNodeIds";

    /// <summary>
    ///     Enricher-spawned network-rule baselines use a dedicated source type so infrastructure declaration
    ///     connector deltas compare normalized parser output only (not post-enrichment expansions).
    /// </summary>
    private const string ExpandedBaselineSourceType = "AppServiceNetworkRule";

    public static IReadOnlyList<CanonicalObject> Expand(IReadOnlyList<CanonicalObject> items)
    {
        ArgumentNullException.ThrowIfNull(items);

        List<CanonicalObject> expanded = [.. items];

        foreach (CanonicalObject item in items)
        {
            if (!IsAppServiceTopology(item))
                continue;

            if (!TryGetIpSecurityRestrictionsJson(item.Properties, out string? rulesJson))
                continue;

            if (string.IsNullOrWhiteSpace(rulesJson))
                continue;

            AppendNetworkRuleObjects(expanded, item, rulesJson);
        }

        return expanded;
    }

    private static bool TryGetIpSecurityRestrictionsJson(
        IReadOnlyDictionary<string, string> properties,
        out string? rulesJson)
    {
        foreach (string key in properties.Keys)
        {
            if (!key.Equals("ipSecurityRestrictions", StringComparison.OrdinalIgnoreCase)
                && !key.Equals("tf.ip_security_restrictions", StringComparison.OrdinalIgnoreCase))
                continue;

            rulesJson = properties[key];

            if (!string.IsNullOrWhiteSpace(rulesJson))
                return true;
        }

        rulesJson = null;
        return false;
    }

    private static bool IsAppServiceTopology(CanonicalObject item)
    {
        if (!string.Equals(item.ObjectType, "TopologyResource", StringComparison.OrdinalIgnoreCase))
            return false;

        if (item.Properties.TryGetValue("resourceType", out string? resourceType)
            && resourceType.Contains("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase))
            return true;

        if (item.Properties.TryGetValue("resourceType", out string? type)
            && type.Contains("appservice", StringComparison.OrdinalIgnoreCase))
            return true;

        if (item.Properties.TryGetValue("terraformType", out string? terraformType))
        {
            string normalized = terraformType.ToLowerInvariant();

            if (normalized is "azurerm_app_service" or "azurerm_linux_web_app" or "azurerm_windows_web_app")
                return true;
        }

        return false;
    }

    private static void AppendNetworkRuleObjects(
        List<CanonicalObject> expanded,
        CanonicalObject appService,
        string rulesJson)
    {
        List<AppServiceAccessRule>? rules = DeserializeAccessRules(rulesJson);

        if (rules is null || rules.Count == 0)
            return;

        string parentNodeId = $"obj-{appService.ObjectId}";
        bool hasOpenInternet = rules.Any(static rule =>
            string.Equals(rule.IpAddress, "0.0.0.0/0", StringComparison.OrdinalIgnoreCase)
            || string.Equals(rule.IpAddress, "Any", StringComparison.OrdinalIgnoreCase));

        if (hasOpenInternet)
        {
            const string publicControlId = "app-service-public-endpoint";

            expanded.Add(new CanonicalObject
            {
                ObjectId = BuildStableBaselineObjectId(appService.ObjectId, publicControlId),
                ObjectType = "SecurityBaseline",
                Name = $"{appService.Name} public network access",
                SourceType = ExpandedBaselineSourceType,
                SourceId = appService.SourceId,
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["controlId"] = publicControlId,
                    ["status"] = "missing",
                    [ProtectedTopologyNodeIdsKey] = parentNodeId,
                    ["parentNodeId"] = parentNodeId,
                    ["ruleKind"] = "OpenPublicEndpoint",
                },
            });
        }

        for (int i = 0; i < rules.Count; i++)
        {
            AppServiceAccessRule rule = rules[i];
            string ruleKind = rule.Action?.Contains("Deny", StringComparison.OrdinalIgnoreCase) == true
                ? "IPRule"
                : string.IsNullOrWhiteSpace(rule.VnetSubnetResourceId)
                    ? "IPRule"
                    : "VirtualNetworkRule";

            string ruleSlot = !string.IsNullOrWhiteSpace(rule.Name)
                ? rule.Name.Trim().ToLowerInvariant()
                : i.ToString(CultureInfo.InvariantCulture);

            string controlId = $"app-service-{ruleKind.ToLowerInvariant()}-{ruleSlot}";

            expanded.Add(new CanonicalObject
            {
                ObjectId = BuildStableBaselineObjectId(appService.ObjectId, controlId),
                ObjectType = "SecurityBaseline",
                Name = $"{appService.Name} {ruleKind} {rule.Name ?? i.ToString()}",
                SourceType = ExpandedBaselineSourceType,
                SourceId = appService.SourceId,
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["controlId"] = controlId,
                    ["status"] = "present",
                    [ProtectedTopologyNodeIdsKey] = parentNodeId,
                    ["parentNodeId"] = parentNodeId,
                    ["ruleKind"] = ruleKind,
                    ["ipAddress"] = rule.IpAddress ?? string.Empty,
                    ["vnetSubnetResourceId"] = rule.VnetSubnetResourceId ?? string.Empty,
                },
            });
        }
    }

    private static string BuildStableBaselineObjectId(string appServiceObjectId, string controlId)
    {
        return ContextIngestionStableLineNames.StableObjectId(
            "AppServiceNetworkRule",
            $"{appServiceObjectId}|{controlId}");
    }

    private static List<AppServiceAccessRule>? DeserializeAccessRules(string rulesJson)
    {
        try
        {
            List<AppServiceAccessRule>? rules = JsonSerializer.Deserialize<List<AppServiceAccessRule>>(rulesJson, JsonOptions);

            if (rules is not null && rules.Exists(static rule => !string.IsNullOrWhiteSpace(rule.IpAddress)))
                return rules;

            return JsonSerializer.Deserialize<List<AppServiceAccessRule>>(rulesJson, TerraformJsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private sealed class AppServiceAccessRule
    {
        public string? Name { get; set; }

        public string? IpAddress { get; set; }

        public string? Action { get; set; }

        public string? VnetSubnetResourceId { get; set; }
    }
}
