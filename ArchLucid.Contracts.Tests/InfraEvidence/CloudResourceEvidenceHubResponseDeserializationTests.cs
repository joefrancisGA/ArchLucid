using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class CloudResourceEvidenceHubResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_hub_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "rbacAssignments": null,
              "networkRelationships": null,
              "recentChanges": null,
              "evidencePointers": null
            }
            """;

        CloudResourceEvidenceHubResponse? response =
            JsonSerializer.Deserialize<CloudResourceEvidenceHubResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.RbacAssignments.Should().NotBeNull().And.BeEmpty();
        response.NetworkRelationships.Should().NotBeNull().And.BeEmpty();
        response.RecentChanges.Should().NotBeNull().And.BeEmpty();
        response.EvidencePointers.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_hub_nested_sections_yields_non_null_defaults()
    {
        const string json = """
            {
              "operationalSecurityFindings": null,
              "architectureReviewFindings": null,
              "remediationInstances": null,
              "auditLineageLink": null
            }
            """;

        CloudResourceEvidenceHubResponse? response =
            JsonSerializer.Deserialize<CloudResourceEvidenceHubResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.OperationalSecurityFindings.Should().NotBeNull();
        response.ArchitectureReviewFindings.Should().NotBeNull();
        response.RemediationInstances.Should().NotBeNull();
        response.AuditLineageLink.Should().NotBeNull();
    }
}
