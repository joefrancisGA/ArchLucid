using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ActorSetDeserializationTests
{
    [Fact]
    public void Deserialize_null_actors_yields_empty_list_not_null()
    {
        const string json = """
            {
              "actors": null
            }
            """;

        ActorSet actorSet = JsonSerializer.Deserialize<ActorSet>(json, ContractJson.Default)!;

        actorSet.Actors.Should().NotBeNull().And.BeEmpty();
        actorSet.MeetsAdmissionMinimum.Should().BeFalse();
    }
}
