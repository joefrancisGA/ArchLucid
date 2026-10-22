using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Metadata;

[Trait("Category", "Unit")]
public sealed class ArchitectureRunDeserializationTests
{
    [Fact]
    public void Deserialize_null_task_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "taskIds": null
            }
            """;

        ArchitectureRun? result =
            JsonSerializer.Deserialize<ArchitectureRun>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.TaskIds.Should().NotBeNull().And.BeEmpty();
    }
}
