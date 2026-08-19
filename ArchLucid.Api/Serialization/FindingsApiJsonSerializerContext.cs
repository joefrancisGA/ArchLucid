using System.Text.Json.Serialization;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Api.Serialization;

/// <summary>Source-generated JSON metadata for findings keyset list projections (TB-2162).</summary>
[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    DictionaryKeyPolicy = JsonKnownNamingPolicy.CamelCase,
    WriteIndented = false)]
[JsonSerializable(typeof(FindingRecordMetadataRow))]
[JsonSerializable(typeof(FindingRecordMetadataRow[]))]
[JsonSerializable(typeof(List<FindingRecordMetadataRow>))]
[JsonSerializable(typeof(IReadOnlyList<FindingRecordMetadataRow>))]
[JsonSerializable(typeof(FindingRecordMetadataPage))]
public partial class FindingsApiJsonSerializerContext : JsonSerializerContext;
