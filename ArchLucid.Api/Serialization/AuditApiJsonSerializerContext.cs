using System.Text.Json.Serialization;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;

namespace ArchLucid.Api.Serialization;

/// <summary>Source-generated JSON metadata for admin audit list/search keyset reads (TB-2162).</summary>
[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    DictionaryKeyPolicy = JsonKnownNamingPolicy.CamelCase,
    WriteIndented = false)]
[JsonSerializable(typeof(AuditEvent))]
[JsonSerializable(typeof(AuditEvent[]))]
[JsonSerializable(typeof(List<AuditEvent>))]
[JsonSerializable(typeof(IReadOnlyList<AuditEvent>))]
[JsonSerializable(typeof(CursorPagedResponse<AuditEvent>))]
public partial class AuditApiJsonSerializerContext : JsonSerializerContext;
