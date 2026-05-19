using System.Text.Json.Nodes;
using System.Text.Json.Schema;

using ArchLucid.Contracts.Governance;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="IPolicyPackSchemaKeysService" />
public sealed class PolicyPackSchemaKeysService : IPolicyPackSchemaKeysService
{
    private static readonly JsonSchemaExporterOptions ExporterOptions = new()
    {
        TreatNullObliviousAsNonNullable = true
    };

    /// <inheritdoc />
    public PolicyPackSchemaKeysResponse GetSchemaKeys()
    {
        JsonNode schemaRoot = JsonSchemaExporter.GetSchemaAsNode(
            typeof(PolicyPackContentDocument),
            ExporterOptions);

        PolicyPackSchemaKeysResponse response = PolicyPackSchemaKeyParser.Parse(schemaRoot);
        AppendCustomKeyDescriptors(response);

        return response;
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
