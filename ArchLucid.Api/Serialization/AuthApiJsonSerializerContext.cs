using System.Text.Json.Serialization;

using ArchLucid.Api.Models;

namespace ArchLucid.Api.Serialization;

/// <summary>Source-generated JSON metadata for <c>GET /api/auth/me</c> (Phase B hot path, TB-2162).</summary>
[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    DictionaryKeyPolicy = JsonKnownNamingPolicy.CamelCase,
    WriteIndented = false)]
[JsonSerializable(typeof(CallerIdentityResponse))]
[JsonSerializable(typeof(CallerClaimResponse))]
[JsonSerializable(typeof(CallerClaimResponse[]))]
[JsonSerializable(typeof(List<CallerClaimResponse>))]
[JsonSerializable(typeof(IReadOnlyList<CallerClaimResponse>))]
public partial class AuthApiJsonSerializerContext : JsonSerializerContext;
