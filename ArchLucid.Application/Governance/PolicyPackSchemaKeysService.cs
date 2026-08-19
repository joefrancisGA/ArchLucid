using System.Text.Json;
using System.Text.Json.Nodes;

using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="IPolicyPackSchemaKeysService" />
public sealed class PolicyPackSchemaKeysService : IPolicyPackSchemaKeysService
{
    /// <inheritdoc />
    public PolicyPackSchemaKeysResponse GetSchemaKeys()
    {
        JsonNode schemaRoot = PolicyPackContentDocumentSchemaExporter.ExportSchemaRoot();

        PolicyPackSchemaKeysResponse response = PolicyPackSchemaKeyParser.Parse(schemaRoot);
        AppendCustomKeyDescriptors(response);

        return response;
    }

    /// <inheritdoc />
    public PolicyPackContentDocumentJsonSchemaResponse GetContentDocumentJsonSchema()
    {
        JsonNode schemaRoot = PolicyPackContentDocumentSchemaExporter.ExportSchemaRoot();

        return new PolicyPackContentDocumentJsonSchemaResponse
        {
            Schema = JsonSerializer.SerializeToElement(schemaRoot)
        };
    }

    private static void AppendCustomKeyDescriptors(PolicyPackSchemaKeysResponse response)
    {
        List<PolicyPackSchemaKeyDescriptor> keys = response.Keys.ToList();

        foreach (PolicyPackSchemaKeyNode node in response.Tree)

            if (node.AllowsCustomKeys)

                keys.Add(
                    new PolicyPackSchemaKeyDescriptor
                    {
                        Path = $"{node.Name}.{PolicyPackSchemaKeyParser.CustomKeySegment}",
                        JsonType = "string",
                        ValueType = node.ValueType,
                        ValueFormat = node.ValueFormat,
                        AllowsCustomKeys = false,
                        Description = $"Custom key under {node.Name}."
                    });

        keys.Sort(static (left, right) => string.Compare(left.Path, right.Path, StringComparison.Ordinal));
        response.Keys = keys;
    }
}
