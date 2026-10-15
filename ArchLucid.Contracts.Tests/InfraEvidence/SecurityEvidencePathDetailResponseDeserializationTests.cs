using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class SecurityEvidencePathDetailResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_hops_and_citing_finding_ids_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "hops": null,
              "citingFindingIds": null
            }
            """;

        SecurityEvidencePathDetailResponse? detail =
            JsonSerializer.Deserialize<SecurityEvidencePathDetailResponse>(json, ContractJson.CamelCaseCompact);

        detail.Should().NotBeNull();
        detail!.Hops.Should().NotBeNull().And.BeEmpty();
        detail.CitingFindingIds.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_routing_yields_empty_list_not_null()
    {
        const string json = """
            {
              "routing": null
            }
            """;

        SecurityEvidencePathDetailResponse? detail =
            JsonSerializer.Deserialize<SecurityEvidencePathDetailResponse>(json, ContractJson.CamelCaseCompact);

        detail.Should().NotBeNull();
        detail!.Routing.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_explanation_template_yields_non_null_template_not_null()
    {
        const string json = """
            {
              "explanationTemplate": null
            }
            """;

        SecurityEvidencePathDetailResponse? detail =
            JsonSerializer.Deserialize<SecurityEvidencePathDetailResponse>(json, ContractJson.CamelCaseCompact);

        detail.Should().NotBeNull();
        detail!.ExplanationTemplate.Should().NotBeNull();
    }

    [Fact]
    public void Deserialize_null_weakest_hop_remains_null()
    {
        const string json = """
            {
              "weakestHop": null
            }
            """;

        SecurityEvidencePathDetailResponse? detail =
            JsonSerializer.Deserialize<SecurityEvidencePathDetailResponse>(json, ContractJson.CamelCaseCompact);

        detail.Should().NotBeNull();
        detail!.WeakestHop.Should().BeNull();
    }
}
