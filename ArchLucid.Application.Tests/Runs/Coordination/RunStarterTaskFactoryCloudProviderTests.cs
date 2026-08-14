using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Coordination;

/// <summary>TB-2244: starter evidence refs honor ArchitectureRequest.CloudProvider.</summary>
[Trait("Suite", "Core")]
public sealed class RunStarterTaskFactoryCloudProviderTests
{
    [Fact]
    public void BuildEvidenceBundle_azure_request_keeps_azure_policy_and_catalog_refs()
    {
        ArchitectureRequest request = CreateRequest(CloudProvider.Azure);
        EvidenceBundle bundle = RunStarterTaskFactory.BuildEvidenceBundle(request);

        bundle.PolicyRefs.Should().Contain([
            RunStarterCloudEvidenceRefs.PolicyPackEnterpriseDefault,
            RunStarterCloudEvidenceRefs.PolicyPackAzureSecurityBaseline,
        ]);
        bundle.PolicyRefs.Should().NotContain([
            RunStarterCloudEvidenceRefs.PolicyPackAwsSecurityBaseline,
            RunStarterCloudEvidenceRefs.PolicyPackGcpSecurityBaseline,
        ]);
        bundle.ServiceCatalogRefs.Should().Contain([
            RunStarterCloudEvidenceRefs.CatalogAzureCoreServices,
            RunStarterCloudEvidenceRefs.CatalogAzureSql,
        ]);
        bundle.ServiceCatalogRefs.Should().NotContain(item => item.StartsWith("catalog:aws-", StringComparison.OrdinalIgnoreCase));
        bundle.ServiceCatalogRefs.Should().NotContain(item => item.StartsWith("catalog:gcp-", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void BuildEvidenceBundle_aws_request_uses_aws_policy_and_catalog_refs()
    {
        ArchitectureRequest request = CreateRequest(CloudProvider.Aws);
        EvidenceBundle bundle = RunStarterTaskFactory.BuildEvidenceBundle(request);

        bundle.PolicyRefs.Should().Contain([
            RunStarterCloudEvidenceRefs.PolicyPackEnterpriseDefault,
            RunStarterCloudEvidenceRefs.PolicyPackAwsSecurityBaseline,
        ]);
        bundle.PolicyRefs.Should().NotContain([
            RunStarterCloudEvidenceRefs.PolicyPackAzureSecurityBaseline,
            RunStarterCloudEvidenceRefs.PolicyPackGcpSecurityBaseline,
        ]);
        bundle.ServiceCatalogRefs.Should().Contain([
            RunStarterCloudEvidenceRefs.CatalogAwsCoreServices,
            RunStarterCloudEvidenceRefs.CatalogAwsRds,
        ]);
        bundle.ServiceCatalogRefs.Should().NotContain(item => item.StartsWith("catalog:azure-", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void BuildEvidenceBundle_gcp_request_uses_gcp_policy_and_catalog_refs()
    {
        ArchitectureRequest request = CreateRequest(CloudProvider.Gcp);
        EvidenceBundle bundle = RunStarterTaskFactory.BuildEvidenceBundle(request);

        bundle.PolicyRefs.Should().Contain([
            RunStarterCloudEvidenceRefs.PolicyPackEnterpriseDefault,
            RunStarterCloudEvidenceRefs.PolicyPackGcpSecurityBaseline,
        ]);
        bundle.PolicyRefs.Should().NotContain([
            RunStarterCloudEvidenceRefs.PolicyPackAzureSecurityBaseline,
            RunStarterCloudEvidenceRefs.PolicyPackAwsSecurityBaseline,
        ]);
        bundle.ServiceCatalogRefs.Should().Contain([
            RunStarterCloudEvidenceRefs.CatalogGcpCoreServices,
            RunStarterCloudEvidenceRefs.CatalogGcpCloudSql,
        ]);
        bundle.ServiceCatalogRefs.Should().NotContain(item => item.StartsWith("catalog:azure-", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void BuildEvidenceBundle_none_cloud_target_omits_cloud_specific_refs()
    {
        ArchitectureRequest request = CreateRequest(CloudProvider.None, constraints: []);
        EvidenceBundle bundle = RunStarterTaskFactory.BuildEvidenceBundle(request);

        bundle.PolicyRefs.Should().Equal([RunStarterCloudEvidenceRefs.PolicyPackEnterpriseDefault]);
        bundle.ServiceCatalogRefs.Should().BeEmpty();
    }

    [Fact]
    public void BuildEvidenceBundle_aws_request_adds_capability_catalog_refs_without_azure_peers()
    {
        ArchitectureRequest request = CreateRequest(
            CloudProvider.Aws,
            requiredCapabilities: ["web", "sql", "search", "ai"]);

        EvidenceBundle bundle = RunStarterTaskFactory.BuildEvidenceBundle(request);

        bundle.ServiceCatalogRefs.Should().Contain([
            RunStarterCloudEvidenceRefs.CatalogAwsOpenSearch,
            RunStarterCloudEvidenceRefs.CatalogAwsBedrock,
        ]);
        bundle.ServiceCatalogRefs.Should().NotContain([
            RunStarterCloudEvidenceRefs.CatalogAzureAiSearch,
            RunStarterCloudEvidenceRefs.CatalogAzureAiServices,
        ]);
    }

    private static ArchitectureRequest CreateRequest(
        CloudProvider cloudProvider,
        IReadOnlyList<string>? requiredCapabilities = null,
        IReadOnlyList<string>? constraints = null) =>
        new()
        {
            Description = "Design a secure multi-tier web application.",
            SystemName = "OrderService",
            Environment = "Production",
            CloudProvider = cloudProvider,
            RequiredCapabilities = requiredCapabilities is null
                ? ["web", "sql"]
                : [.. requiredCapabilities],
            Constraints = constraints is null
                ? ["private-networking"]
                : [.. constraints],
        };
}
