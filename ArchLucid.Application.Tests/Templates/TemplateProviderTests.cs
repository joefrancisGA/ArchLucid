using System.Text.Json;

using ArchLucid.Application.Templates;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Templates;
[Trait("Category", "Unit")]

public sealed class TemplateProviderTests
{
    [Fact]
    public void Constructor_loads_all_templates_with_valid_request_shape()
    {
        TemplateProvider provider = new();

        IReadOnlyList<ArchitectureRequestTemplateSummary> summaries = provider.GetSummaries();

        summaries.Should().HaveCount(7);
        summaries.Select(s => s.Id).Should().OnlyHaveUniqueItems();
        summaries.Should().Contain(s => s.Id == "webapp-sql");
        summaries.Should().Contain(s => s.Id == "serverless-api");
        summaries.Should().Contain(s => s.Id == "microservices-aks");
        summaries.Should().Contain(s => s.Id == "hipaa-compliant-api");
        summaries.Should().Contain(s => s.Id == "pci-dss-payment-gateway");
        summaries.Should().Contain(s => s.Id == "serverless-api-aws");
        summaries.Should().Contain(s => s.Id == "microservices-gke");

        foreach (ArchitectureRequestTemplateSummary s in summaries)
        {
            s.Id.Should().NotBeNullOrWhiteSpace();
            s.Name.Should().NotBeNullOrWhiteSpace();
            s.Description.Should().NotBeNullOrWhiteSpace();
        }

        foreach (string id in new[]
                 {
                     "webapp-sql", "serverless-api", "microservices-aks", "hipaa-compliant-api", "pci-dss-payment-gateway",
                     "serverless-api-aws", "microservices-gke",
                 })
        {
            bool found = provider.TryGetArchitectureRequest(id, out ArchitectureRequest? request);
            found.Should().BeTrue();
            request.Should().NotBeNull();
            request.RequestId.Should().NotBeNullOrWhiteSpace();
            request.RequestId.Length.Should().BeLessOrEqualTo(64);
            request.Description.Length.Should().BeInRange(ArchitectureRequestFieldLimits.MinDescriptionLength, ArchitectureRequestFieldLimits.MaxDescriptionLength);
            request.SystemName.Should().NotBeNullOrWhiteSpace();
            request.Environment.Should().NotBeNullOrWhiteSpace();
            request.CloudProvider.Should().BeOneOf(CloudProvider.Azure, CloudProvider.Aws, CloudProvider.Gcp);

            request.Constraints.Should().NotBeNull();
            request.RequiredCapabilities.Should().NotBeNull();
            request.Assumptions.Should().NotBeNull();
            request.InlineRequirements.Should().NotBeNull();
            request.Documents.Should().NotBeNull();
            request.PolicyReferences.Should().NotBeNull();
            request.TopologyHints.Should().NotBeNull();
            request.SecurityBaselineHints.Should().NotBeNull();
            request.InfrastructureDeclarations.Should().NotBeNull();
        }
    }

    [Fact]
    public void TryGetArchitectureRequest_rejects_blank_id()
    {
        TemplateProvider provider = new();

        provider.TryGetArchitectureRequest(" ", out ArchitectureRequest? _).Should().BeFalse();
        provider.TryGetArchitectureRequest("", out ArchitectureRequest? _).Should().BeFalse();
    }

    [Fact]
    public void Embedded_templates_round_trip_through_contract_json_compact()
    {
        TemplateProvider provider = new();
        provider.TryGetArchitectureRequest("webapp-sql", out ArchitectureRequest? original).Should().BeTrue();
        original.Should().NotBeNull();

        string json = JsonSerializer.Serialize(original, ContractJson.CamelCaseIgnoreNullCompact);
        ArchitectureRequest? restored = JsonSerializer.Deserialize<ArchitectureRequest>(json, ContractJson.CamelCaseIgnoreNullCompact);

        restored.Should().NotBeNull();
        restored.RequestId.Should().Be(original.RequestId);
        restored.SystemName.Should().Be(original.SystemName);
    }

    [Fact]
    public void Aws_and_Gcp_embedded_templates_use_expected_cloud_providers()
    {
        TemplateProvider provider = new();

        provider.TryGetArchitectureRequest("serverless-api-aws", out ArchitectureRequest? aws).Should().BeTrue();
        aws.Should().NotBeNull();
        aws!.CloudProvider.Should().Be(CloudProvider.Aws);

        provider.TryGetArchitectureRequest("microservices-gke", out ArchitectureRequest? gcp).Should().BeTrue();
        gcp.Should().NotBeNull();
        gcp!.CloudProvider.Should().Be(CloudProvider.Gcp);
    }
}
