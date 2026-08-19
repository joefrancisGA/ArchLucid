using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Testing;

namespace ArchLucid.Api.Tests.Contracts;

/// <summary>
///     Guards TB-285: buyer/proof OpenAPI schemas must not expose forbidden internal or forensics property names.
/// </summary>
[Trait("Suite", "Core")]
public sealed class ProofSurfaceForbiddenPropertyDriftTests(OpenApiContractWebAppFactory factory)
    : IClassFixture<OpenApiContractWebAppFactory>
{
    [SkippableFact]
    public async Task Live_openapi_buyer_proof_schemas_exclude_forbidden_properties()
    {
        using HttpClient client = factory.CreateClient(
            new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        using HttpResponseMessage response = await client.GetAsync("/openapi/v1.json");
        await response.EnsureSuccessForTestAsync();

        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        JsonElement schemas = doc.RootElement.GetProperty("components").GetProperty("schemas");

        foreach (ProofSurfaceContractRegistry.Surface surface in ProofSurfaceContractRegistry.Surfaces)
        {
            if (surface.ForbiddenJsonProperties.Count == 0)
                continue;

            schemas.TryGetProperty(surface.OpenApiSchemaName, out JsonElement schema).Should().BeTrue(
                $"OpenAPI must expose schema '{surface.OpenApiSchemaName}'.");

            JsonElement properties = schema.GetProperty("properties");

            foreach (string propertyName in surface.ForbiddenJsonProperties)
            {
                properties.TryGetProperty(propertyName, out JsonElement _).Should().BeFalse(
                    $"{surface.OpenApiSchemaName} must not expose forbidden property '{propertyName}' on buyer/proof surfaces.");
            }
        }
    }

    [Fact]
    public void Contract_types_exclude_forbidden_json_property_names()
    {
        foreach (ProofSurfaceContractRegistry.Surface surface in ProofSurfaceContractRegistry.Surfaces)
        {
            if (surface.ForbiddenJsonProperties.Count == 0)
                continue;

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

            foreach (string propertyName in surface.ForbiddenJsonProperties)
            {
                wireNames.Contains(propertyName).Should().BeFalse(
                    $"{surface.ContractType.Name} must not include forbidden property wired as '{propertyName}'.");
            }
        }
    }
}
