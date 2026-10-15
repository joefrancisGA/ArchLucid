using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPacksPageBundleResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_packs_yields_empty_list_not_null()
    {
        const string json = """
            {
              "packs": null
            }
            """;

        PolicyPacksPageBundleResponse? response =
            JsonSerializer.Deserialize<PolicyPacksPageBundleResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Packs.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_effective_and_content_yields_non_null_nested_objects()
    {
        const string json = """
            {
              "effective": null,
              "effectiveContent": null
            }
            """;

        PolicyPacksPageBundleResponse? response =
            JsonSerializer.Deserialize<PolicyPacksPageBundleResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Effective.Should().NotBeNull();
        response.EffectiveContent.Should().NotBeNull();
    }
}
