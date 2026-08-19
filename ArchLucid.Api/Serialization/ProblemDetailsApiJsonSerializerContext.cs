using System.Text.Json.Serialization;

using Microsoft.AspNetCore.Mvc;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Api.Serialization;

/// <summary>Source-generated JSON metadata for RFC 7807 problem responses (TB-2162).</summary>
[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    DictionaryKeyPolicy = JsonKnownNamingPolicy.CamelCase,
    WriteIndented = false)]
[JsonSerializable(typeof(MvcProblemDetails))]
[JsonSerializable(typeof(ValidationProblemDetails))]
[JsonSerializable(typeof(HttpValidationProblemDetails))]
[JsonSerializable(typeof(Dictionary<string, string[]>))]
[JsonSerializable(typeof(IDictionary<string, string[]>))]
public partial class ProblemDetailsApiJsonSerializerContext : JsonSerializerContext;
