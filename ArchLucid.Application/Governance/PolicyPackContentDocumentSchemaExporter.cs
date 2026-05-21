using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Schema;
using System.Text.Json.Serialization.Metadata;

using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Exports the registered <see cref="PolicyPackContentDocument" /> JSON Schema used by OpenAPI and UI validators.
/// </summary>
internal static class PolicyPackContentDocumentSchemaExporter
{
    private static readonly JsonSerializerOptions SchemaExportSerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        TypeInfoResolver = new DefaultJsonTypeInfoResolver()
    };

    private static readonly JsonSchemaExporterOptions ExporterOptions = new()
    {
        TreatNullObliviousAsNonNullable = true
    };

    internal static JsonNode ExportSchemaRoot() =>
        JsonSchemaExporter.GetJsonSchemaAsNode(
            SchemaExportSerializerOptions,
            typeof(PolicyPackContentDocument),
            ExporterOptions);
}
