using System.Text.Json.Nodes;

using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Walks a JSON Schema object exported from <see cref="ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackContentDocument" />.
/// </summary>
internal static class PolicyPackSchemaKeyParser
{
    internal const string CustomKeySegment = "{key}";

    private static readonly Dictionary<string, string> KnownDescriptions = new(StringComparer.Ordinal)
    {
        ["complianceRuleIds"] = "Compliance rules selected by persisted ComplianceRule id (GUID).",
        ["complianceRuleKeys"] = "String rule IDs matching file-based compliance rule packs.",
        ["alertRuleIds"] = "When non-empty, restricts simple alert evaluation to these rule ids.",
        ["compositeAlertRuleIds"] = "When non-empty, restricts composite alert evaluation to these rule ids.",
        ["advisoryDefaults"] = "Key/value defaults merged into advisory improvement plans (string values).",
        ["metadata"] = "Opaque key/value metadata merged with precedence during resolution."
    };

    internal static PolicyPackSchemaKeysResponse Parse(JsonNode schemaRoot)
    {
        JsonObject? rootObject = schemaRoot.AsObject();

        if (rootObject is null || !rootObject.TryGetPropertyValue("properties", out JsonNode? propertiesNode))
            return new PolicyPackSchemaKeysResponse();

        JsonObject? properties = propertiesNode?.AsObject();

        if (properties is null)
            return new PolicyPackSchemaKeysResponse();

        List<PolicyPackSchemaKeyDescriptor> keys = [];
        List<PolicyPackSchemaKeyNode> tree = [];

        foreach (KeyValuePair<string, JsonNode?> property in properties)
        {
            string name = property.Key;
            JsonNode? propertySchema = property.Value;

            if (propertySchema is null)
                continue;

            keys.Add(BuildDescriptor(name, propertySchema));
            tree.Add(BuildTreeNode(name, propertySchema));
        }

        keys.Sort(static (left, right) => string.Compare(left.Path, right.Path, StringComparison.Ordinal));
        tree.Sort(static (left, right) => string.Compare(left.Name, right.Name, StringComparison.Ordinal));

        return new PolicyPackSchemaKeysResponse { Keys = keys, Tree = tree };
    }

    private static PolicyPackSchemaKeyDescriptor BuildDescriptor(string path, JsonNode propertySchema)
    {
        string jsonType = ReadType(propertySchema);
        JsonNode? itemsSchema = ReadItems(propertySchema);
        JsonNode? additionalPropertiesSchema = ReadAdditionalProperties(propertySchema);
        bool allowsCustomKeys = additionalPropertiesSchema is not null;

        PolicyPackSchemaKeyDescriptor descriptor = new()
        {
            Path = path,
            JsonType = jsonType,
            ValueType = ReadValueType(itemsSchema, additionalPropertiesSchema),
            ValueFormat = ReadFormat(itemsSchema, additionalPropertiesSchema),
            AllowsCustomKeys = allowsCustomKeys,
            Description = KnownDescriptions.GetValueOrDefault(path)
        };

        return descriptor;
    }

    private static PolicyPackSchemaKeyNode BuildTreeNode(string name, JsonNode propertySchema)
    {
        string jsonType = ReadType(propertySchema);
        JsonNode? itemsSchema = ReadItems(propertySchema);
        JsonNode? additionalPropertiesSchema = ReadAdditionalProperties(propertySchema);
        bool allowsCustomKeys = additionalPropertiesSchema is not null;

        List<PolicyPackSchemaKeyNode> children = [];

        if (allowsCustomKeys)

            children.Add(
                new PolicyPackSchemaKeyNode
                {
                    Name = CustomKeySegment,
                    JsonType = "string",
                    ValueType = ReadType(additionalPropertiesSchema!),
                    ValueFormat = ReadFormat(additionalPropertiesSchema, null),
                    AllowsCustomKeys = false,
                    Description = $"Custom key under {name}."
                });

        return new PolicyPackSchemaKeyNode
        {
            Name = name,
            JsonType = jsonType,
            ValueType = ReadValueType(itemsSchema, additionalPropertiesSchema),
            ValueFormat = ReadFormat(itemsSchema, additionalPropertiesSchema),
            AllowsCustomKeys = allowsCustomKeys,
            Description = KnownDescriptions.GetValueOrDefault(name),
            Children = children
        };
    }

    private static string ReadType(JsonNode schema)
    {
        if (schema.AsObject()?.TryGetPropertyValue("type", out JsonNode? typeNode) == true &&
            typeNode is JsonValue typeValue &&
            typeValue.TryGetValue<string>(out string? type) &&
            !string.IsNullOrWhiteSpace(type))
            return type;

        return "object";
    }

    private static JsonNode? ReadItems(JsonNode schema) =>
        schema.AsObject()?.TryGetPropertyValue("items", out JsonNode? itemsNode) == true ? itemsNode : null;

    private static JsonNode? ReadAdditionalProperties(JsonNode schema)
    {
        JsonObject? objectSchema = schema.AsObject();

        if (objectSchema is null)
            return null;

        if (!objectSchema.TryGetPropertyValue("additionalProperties", out JsonNode? additionalPropertiesNode))
            return null;

        if (additionalPropertiesNode is JsonValue boolValue &&
            boolValue.TryGetValue<bool>(out bool allowed) &&
            !allowed)
            return null;

        return additionalPropertiesNode;
    }

    private static string? ReadValueType(JsonNode? itemsSchema, JsonNode? additionalPropertiesSchema)
    {
        if (itemsSchema is not null)
            return ReadType(itemsSchema);

        if (additionalPropertiesSchema is not null)
            return ReadType(additionalPropertiesSchema);

        return null;
    }

    private static string? ReadFormat(JsonNode? primarySchema, JsonNode? secondarySchema)
    {
        string? format = ReadFormatFromSchema(primarySchema);

        if (!string.IsNullOrWhiteSpace(format))
            return format;

        return ReadFormatFromSchema(secondarySchema);
    }

    private static string? ReadFormatFromSchema(JsonNode? schema)
    {
        if (schema?.AsObject()?.TryGetPropertyValue("format", out JsonNode? formatNode) != true)
            return null;

        if (formatNode is JsonValue formatValue &&
            formatValue.TryGetValue<string>(out string? format) &&
            !string.IsNullOrWhiteSpace(format))
            return format;

        return null;
    }
}
