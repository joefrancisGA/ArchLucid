using System.Text.Json;

using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Alerts.Delivery;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Alerts.Delivery;

/// <summary>Parses and merges <see cref="AlertRoutingCriteria" /> in subscription <c>metadataJson</c>.</summary>
public static class AlertRoutingCriteriaMetadata
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

    private static Dictionary<string, JsonElement> ReadRootObject(string? metadataJson)
    {
        if (string.IsNullOrWhiteSpace(metadataJson))
        {
            return new Dictionary<string, JsonElement>(StringComparer.Ordinal);
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(metadataJson);
            Dictionary<string, JsonElement> root = new(StringComparer.Ordinal);

            if (document.RootElement.ValueKind == JsonValueKind.Object)
            {
                foreach (JsonProperty property in document.RootElement.EnumerateObject())
                {
                    root[property.Name] = property.Value.Clone();
                }
            }

            return root;
        }
        catch (JsonException)
        {
            return new Dictionary<string, JsonElement>(StringComparer.Ordinal);
        }
    }

    private static IReadOnlyList<string> ReadSeverityArray(JsonElement parent, string propertyName)
    {
        if (!TryGetPropertyCaseInsensitive(parent, propertyName, out JsonElement arrayElement) ||
            arrayElement.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        List<string> values = [];

        foreach (JsonElement item in arrayElement.EnumerateArray())
        {
            string? value = ReadSeverityArrayItem(item);

            if (!string.IsNullOrWhiteSpace(value))
            {
                values.Add(value.Trim());
            }
        }

        return values;
    }

    private static string? ReadSeverityArrayItem(JsonElement item)
    {
        if (item.ValueKind == JsonValueKind.String)
        {
            return item.GetString();
        }

        if (item.ValueKind == JsonValueKind.Number && item.TryGetInt32(out int numeric))
        {
            return MapFindingSeverityOrdinalToAlertLabel(numeric);
        }

        return null;
    }

    private static string? MapFindingSeverityOrdinalToAlertLabel(int ordinal)
    {
        if (!Enum.IsDefined(typeof(FindingSeverity), ordinal))
        {
            return null;
        }

        return (FindingSeverity)ordinal switch
        {
            FindingSeverity.Info => AlertSeverity.Info,
            FindingSeverity.Warning => AlertSeverity.Warning,
            FindingSeverity.Error => AlertSeverity.High,
            FindingSeverity.Critical => AlertSeverity.Critical,
            _ => null,
        };
    }

    private static IReadOnlyList<string> ReadStringArray(JsonElement parent, string propertyName)
    {
        if (!TryGetPropertyCaseInsensitive(parent, propertyName, out JsonElement arrayElement) ||
            arrayElement.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        List<string> values = [];

        foreach (JsonElement item in arrayElement.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.String)
            {
                string value = item.GetString()?.Trim() ?? string.Empty;

                if (value.Length > 0)
                {
                    values.Add(value);
                }
            }
        }

        return values;
    }

    private static IReadOnlyList<string> NormalizeList(IReadOnlyList<string> values)
    {
        return values
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;

                return true;
            }
        }

        value = default;

        return false;
    }
}
