using System.Text.Json;

namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Response for <c>GET /v1/governance/policy-pack-content-schema</c>: the registered
///     <see cref="PolicyPackContentDocument" /> JSON Schema
///     for client-side validation (same exporter as OpenAPI / schema-keys).
/// </summary>
public sealed class PolicyPackContentDocumentJsonSchemaResponse
{
    /// <summary>JSON Schema document (draft 2020-12) for policy pack content documents.</summary>
    public required JsonElement Schema { get; init; }
}
