using System.Text.Json.Serialization;

using ArchLucid.Api.Models;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Pagination;

namespace ArchLucid.Api.Serialization;

/// <summary>Source-generated JSON metadata for run list / keyset operator reads (TB-2162).</summary>
[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    DictionaryKeyPolicy = JsonKnownNamingPolicy.CamelCase,
    WriteIndented = false)]
[JsonSerializable(typeof(RunListItemResponse))]
[JsonSerializable(typeof(RunListItemResponse[]))]
[JsonSerializable(typeof(List<RunListItemResponse>))]
[JsonSerializable(typeof(IReadOnlyList<RunListItemResponse>))]
[JsonSerializable(typeof(RunSummary))]
[JsonSerializable(typeof(RunSummary[]))]
[JsonSerializable(typeof(List<RunSummary>))]
[JsonSerializable(typeof(IReadOnlyList<RunSummary>))]
[JsonSerializable(typeof(CursorPagedResponse<RunListItemResponse>))]
public partial class RunsApiJsonSerializerContext : JsonSerializerContext;
