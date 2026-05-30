using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Testing;

using ArchLucid.Persistence.Queries;

namespace ArchLucid.Api.Tests.Contracts;

/// <summary>
///     Guards TB-106/TB-113: live OpenAPI <c>RunDetailDto</c> exposes forensics fields declared on the C# read model.
/// </summary>
[Trait("Suite", "Core")]
public sealed class RunDetailDtoOpenApiContractTests(OpenApiContractWebAppFactory factory)
    : IClassFixture<OpenApiContractWebAppFactory>
{
    private static readonly string[] CriticalForensicsProperties =
    [
        "agentExecutionLlmCostEstimate",
        "trustEvidenceCard",
        "results",
        "findingCoverageSummary",
        "degradedFindingCoverage",
        "executionFlavorBuyerSummary",
        "runDegradedExecution",
        "retrievalGroundingSummary",
        "lastAgentExecutionFailure",
    ];

    [SkippableFact]
    public async Task Live_openapi_run_detail_dto_includes_operator_forensics_properties()
    {
        using HttpClient client = factory.CreateClient(
            new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        using HttpResponseMessage response = await client.GetAsync("/openapi/v1.json");
        await response.EnsureSuccessForTestAsync();

        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        JsonElement properties = doc.RootElement
            .GetProperty("components")
            .GetProperty("schemas")
            .GetProperty(nameof(RunDetailDto))
            .GetProperty("properties");

        foreach (string propertyName in CriticalForensicsProperties)
        {
            properties.TryGetProperty(propertyName, out JsonElement _)
                .Should()
                .BeTrue($"RunDetailDto must expose '{propertyName}' for operator forensics (TB-106). Regenerate OpenAPI snapshot if intentional.");
        }
    }

    [Fact]
    public void RunDetailDto_reflection_wire_names_are_covered_by_critical_forensics_list()
    {
        HashSet<string> wireNames = typeof(RunDetailDto)
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Select(static property =>
            {
                JsonPropertyNameAttribute? jsonName = property.GetCustomAttribute<JsonPropertyNameAttribute>();

                if (jsonName is not null)
                {
                    return jsonName.Name;
                }

                return JsonNamingPolicy.CamelCase.ConvertName(property.Name);
            })
            .ToHashSet(StringComparer.Ordinal);

        foreach (string propertyName in CriticalForensicsProperties)
        {
            wireNames.Contains(propertyName).Should().BeTrue(
                $"Critical forensics property '{propertyName}' must exist on {nameof(RunDetailDto)}.");
        }
    }
}
