using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ArchitectureRiskRegisterListOptionsDeserializationTests
{
    [Fact]
    public void Deserialize_null_assigned_to_user_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "assignedToUserIds": null
            }
            """;

        ArchitectureRiskRegisterListOptions? result =
            JsonSerializer.Deserialize<ArchitectureRiskRegisterListOptions>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.AssignedToUserIds.Should().NotBeNull().And.BeEmpty();
    }
}
