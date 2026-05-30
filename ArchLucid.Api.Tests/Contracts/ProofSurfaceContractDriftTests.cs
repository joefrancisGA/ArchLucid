using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Client.Generated;

using JsonElement = System.Text.Json.JsonElement;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Testing;

namespace ArchLucid.Api.Tests.Contracts;

/// <summary>
///     Focused drift gate for proof and ROI DTOs across OpenAPI, contracts, generated client, and CLI shapes.
/// </summary>
[Trait("Suite", "Core")]
public sealed class ProofSurfaceContractDriftTests(OpenApiContractWebAppFactory factory)
    : IClassFixture<OpenApiContractWebAppFactory>
{
    [SkippableFact]
    public async Task Live_openapi_includes_critical_proof_surface_properties()
    {
        using HttpClient client = factory.CreateClient(
            new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        using HttpResponseMessage response = await client.GetAsync("/openapi/v1.json");
        await response.EnsureSuccessForTestAsync();

        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        JsonElement schemas = doc.RootElement.GetProperty("components").GetProperty("schemas");

        foreach (ProofSurfaceContractRegistry.Surface surface in ProofSurfaceContractRegistry.Surfaces)
        {
            schemas.TryGetProperty(surface.OpenApiSchemaName, out JsonElement schema).Should().BeTrue(
                $"OpenAPI must expose schema '{surface.OpenApiSchemaName}'.");

            JsonElement properties = schema.GetProperty("properties");

            foreach (string propertyName in surface.CriticalJsonProperties)
            {
                properties.TryGetProperty(propertyName, out JsonElement _).Should().BeTrue(
                    $"{surface.OpenApiSchemaName} must expose '{propertyName}'. Regenerate OpenAPI snapshot if intentional.");
            }
        }
    }

    [Fact]
    public void Contract_types_expose_critical_json_property_names()
    {
        foreach (ProofSurfaceContractRegistry.Surface surface in ProofSurfaceContractRegistry.Surfaces)
        {
            HashSet<string> wireNames = surface.ContractType
                .GetProperties(BindingFlags.Public | BindingFlags.Instance)
                .Select(static property =>
                {
                    JsonPropertyNameAttribute? jsonName = property.GetCustomAttribute<JsonPropertyNameAttribute>();

                    if (jsonName is not null)
                        return jsonName.Name;

                    return JsonNamingPolicy.CamelCase.ConvertName(property.Name);
                })
                .ToHashSet(StringComparer.Ordinal);

            foreach (string propertyName in surface.CriticalJsonProperties)
            {
                wireNames.Contains(propertyName).Should().BeTrue(
                    $"{surface.ContractType.Name} must include property wired as '{propertyName}'.");
            }
        }
    }

    [Fact]
    public void Generated_api_client_types_expose_critical_proof_properties()
    {
        Assembly clientAssembly = typeof(ArchLucidApiClient).Assembly;

        foreach (ProofSurfaceContractRegistry.Surface surface in ProofSurfaceContractRegistry.Surfaces)
        {
            Type? generatedType = clientAssembly
                .GetTypes()
                .FirstOrDefault(type => type.Name == surface.GeneratedClientTypeName);

            generatedType.Should().NotBeNull($"Generated client must define {surface.GeneratedClientTypeName}.");

            HashSet<string> propertyNames = generatedType!
                .GetProperties(BindingFlags.Public | BindingFlags.Instance)
                .Select(static property => property.Name)
                .ToHashSet(StringComparer.Ordinal);

            foreach (string jsonName in surface.CriticalJsonProperties)
            {
                string pascal = char.ToUpperInvariant(jsonName[0]) + jsonName[1..];
                bool present = propertyNames.Contains(pascal)
                               || propertyNames.Contains(jsonName, StringComparer.OrdinalIgnoreCase);

                present.Should().BeTrue(
                    $"{surface.GeneratedClientTypeName} must expose '{jsonName}' for CLI/UI parity.");
            }
        }
    }
}
