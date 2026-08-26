using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests;

/// <summary>
///     Ensures <c>templates/starter-proof-packs/*/architecture-request.json</c> deserialize to <see cref="ArchitectureRequest" />
///     .
/// </summary>
[Trait("Suite", "Core")]
public sealed class StarterProofPackArchitectureRequestTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new JsonStringEnumConverter(null) }
    };

    public static TheoryData<string, CloudProvider> StarterArchitectureRequestRelativePaths
    {
        get
        {
            TheoryData<string, CloudProvider> data = new();

            data.Add(Path.Combine("templates", "starter-proof-packs", "regulated-saas-soc-procurement", "architecture-request.json"), CloudProvider.Azure);
            data.Add(Path.Combine("templates", "starter-proof-packs", "healthcare-data-workflow", "architecture-request.json"), CloudProvider.Azure);
            data.Add(Path.Combine("templates", "starter-proof-packs", "azure-cost-governance", "architecture-request.json"), CloudProvider.Azure);
            data.Add(Path.Combine("templates", "starter-proof-packs", "aws-cost-governance", "architecture-request.json"), CloudProvider.Aws);
            data.Add(Path.Combine("templates", "starter-proof-packs", "gcp-cost-governance", "architecture-request.json"), CloudProvider.Gcp);
            data.Add(Path.Combine("templates", "starter-proof-packs", "ai-llm-workload", "architecture-request.json"), CloudProvider.Azure);

            return data;
        }
    }

    [Theory]
    [MemberData(nameof(StarterArchitectureRequestRelativePaths))]
    public void Starter_architecture_request_json_deserializes(string relativePath, CloudProvider expectedCloudProvider)
    {
        string fullPath = Path.Combine(AppContext.BaseDirectory, relativePath);

        if (!File.Exists(fullPath))
            throw new FileNotFoundException($"Copy template to test output: {fullPath}");

        string json = File.ReadAllText(fullPath);
        ArchitectureRequest? request = JsonSerializer.Deserialize<ArchitectureRequest>(json, JsonOptions);

        request.Should().NotBeNull();
        request.RequestId.Should().NotBeNullOrWhiteSpace();
        request.RequestId.Length.Should().BeLessThanOrEqualTo(64);
        request.SystemName.Should().NotBeNullOrWhiteSpace();
        request.Description.Length.Should().BeInRange(ArchitectureRequestFieldLimits.MinDescriptionLength, ArchitectureRequestFieldLimits.MaxDescriptionLength);
        request.Environment.Should().NotBeNullOrWhiteSpace();
        request.CloudProvider.Should().Be(expectedCloudProvider);
        request.Constraints.Should().NotBeNull();
        request.PolicyReferences.Should().NotBeNull();
        request.PolicyReferences.Should().NotBeEmpty();
    }
}
