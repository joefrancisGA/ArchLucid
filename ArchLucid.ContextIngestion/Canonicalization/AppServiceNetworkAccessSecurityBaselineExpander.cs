using System.Text.Json;

using ArchLucid.Contracts.Persistence.Context;

namespace ArchLucid.ContextIngestion.Canonicalization;

/// <summary>
///     Expands App Service ARM network access rules into SecurityBaseline and rule nodes linked to the site.
/// </summary>
public static class AppServiceNetworkAccessSecurityBaselineExpander
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    /// <summary>Matches <see cref="ArchLucid.KnowledgeGraph.CanonicalGraphPropertyKeys.ProtectedTopologyNodeIds"/>.</summary>
    private const string ProtectedTopologyNodeIdsKey = "protectedTopologyNodeIds";

    public static IReadOnlyList<CanonicalObject> Expand(IReadOnlyList<CanonicalObject> items)
    {
        ArgumentNullException.ThrowIfNull(items);

        List<CanonicalObject> expanded = [.. items];

        foreach (CanonicalObject item in items)
        {
            if (!IsAppServiceTopology(item))
                continue;

            if (!item.Properties.TryGetValue("ipSecurityRestrictions", out string? rulesJson)
                && !item.Properties.TryGetValue("IpSecurityRestrictions", out rulesJson))
                continue;

            if (string.IsNullOrWhiteSpace(rulesJson))
                continue;

            AppendNetworkRuleObjects(expanded, item, rulesJson);
        }

        return expanded;
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

        return item.Name.Contains("app", StringComparison.OrdinalIgnoreCase)
            && item.Properties.ContainsKey("ipSecurityRestrictions");
    }

    private static void AppendNetworkRuleObjects(
        List<CanonicalObject> expanded,
        CanonicalObject appService,
        string rulesJson)
    {
        List<AppServiceAccessRule>? rules;

        try
        {
            rules = JsonSerializer.Deserialize<List<AppServiceAccessRule>>(rulesJson, JsonOptions);
        }
        catch (JsonException)
        {
            return;
        }

        if (rules is null || rules.Count == 0)
            return;

        string parentNodeId = $"obj-{appService.ObjectId}";
        bool hasOpenInternet = rules.Any(static rule =>
            string.Equals(rule.IpAddress, "0.0.0.0/0", StringComparison.OrdinalIgnoreCase)
            || string.Equals(rule.IpAddress, "Any", StringComparison.OrdinalIgnoreCase));

        if (hasOpenInternet)
        {
            expanded.Add(new CanonicalObject
            {
                ObjectType = "SecurityBaseline",
                Name = $"{appService.Name} public network access",
                SourceType = appService.SourceType,
                SourceId = appService.SourceId,
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["controlId"] = "app-service-public-endpoint",
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

            expanded.Add(new CanonicalObject
            {
                ObjectType = "SecurityBaseline",
                Name = $"{appService.Name} {ruleKind} {rule.Name ?? i.ToString()}",
                SourceType = appService.SourceType,
                SourceId = appService.SourceId,
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["controlId"] = $"app-service-{ruleKind.ToLowerInvariant()}-{i}",
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

    private sealed class AppServiceAccessRule
    {
        public string? Name { get; set; }

        public string? IpAddress { get; set; }

        public string? Action { get; set; }

        public string? VnetSubnetResourceId { get; set; }
    }
}
