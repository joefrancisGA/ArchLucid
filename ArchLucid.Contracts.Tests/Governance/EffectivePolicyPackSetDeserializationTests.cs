using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class EffectivePolicyPackSetDeserializationTests
{
    [Fact]
    public void Deserialize_null_packs_yields_empty_list_not_null()
    {
        const string json = """
            {
              "packs": null
            }
            """;

        EffectivePolicyPackSet? result =
            JsonSerializer.Deserialize<EffectivePolicyPackSet>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Packs.Should().NotBeNull().And.BeEmpty();
    }
}
