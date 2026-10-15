using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureIdentityDetailDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "drafts": null,
              "reviews": null,
              "versions": null
            }
            """;

        ArchitectureIdentityDetail? result =
            JsonSerializer.Deserialize<ArchitectureIdentityDetail>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Drafts.Should().NotBeNull().And.BeEmpty();
        result.Reviews.Should().NotBeNull().And.BeEmpty();
        result.Versions.Should().NotBeNull().And.BeEmpty();
    }
}
