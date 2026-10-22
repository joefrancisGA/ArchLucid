using System.Text.Json;

using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Alerts.Delivery;

namespace ArchLucid.Core.Alerts.Delivery;

/// <summary>Parses and merges <see cref="AlertRoutingCriteria" /> in subscription <c>metadataJson</c>.</summary>
public static partial class AlertRoutingCriteriaMetadata
{
    private const string RoutingCriteriaPropertyName = "routingCriteria";

    public static AlertRoutingCriteria Parse(string? metadataJson)
    {
        if (string.IsNullOrWhiteSpace(metadataJson))
        {
            return new AlertRoutingCriteria();
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(metadataJson);
            JsonElement root = document.RootElement;

            if (!TryGetPropertyCaseInsensitive(root, RoutingCriteriaPropertyName, out JsonElement criteriaElement) ||
                criteriaElement.ValueKind != JsonValueKind.Object)
            {
                return new AlertRoutingCriteria();
            }

            return new AlertRoutingCriteria
            {
                Severities = ReadSeverityArray(criteriaElement, "severities"),
                FindingTypes = ReadStringArray(criteriaElement, "findingTypes"),
                Tags = ReadStringArray(criteriaElement, "tags"),
            };
        }
        catch (JsonException)
        {
            return new AlertRoutingCriteria();
        }
    }

    public static string MergeIntoMetadata(string? metadataJson, AlertRoutingCriteria? criteria)
    {
        Dictionary<string, JsonElement> root = ReadRootObject(metadataJson);

        if (criteria is null ||
            (criteria.Severities.Count == 0 && criteria.FindingTypes.Count == 0 && criteria.Tags.Count == 0))
        {
            root.Remove(RoutingCriteriaPropertyName);
        }
        else
        {
            string criteriaJson = JsonSerializer.Serialize(
                new
                {
                    severities = NormalizeList(criteria.Severities),
                    findingTypes = NormalizeList(criteria.FindingTypes),
                    tags = NormalizeList(criteria.Tags),
                });

            using JsonDocument criteriaDocument = JsonDocument.Parse(criteriaJson);
            root[RoutingCriteriaPropertyName] = criteriaDocument.RootElement.Clone();
        }

        if (root.Count == 0)
        {
            return "{}";
        }

        return JsonSerializer.Serialize(root);
    }
}
