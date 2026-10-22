using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureQuickScanRequestDeserializationTests
{
    [Fact]
    public void Deserialize_null_architecture_concerns_yields_empty_list_not_null()
    {
        const string json = """
            {
              "systemName": "Demo",
              "primaryEnvironment": "Azure",
              "description": "scope",
              "architectureConcerns": null
            }
            """;

        ArchitectureQuickScanRequest request =
            JsonSerializer.Deserialize<ArchitectureQuickScanRequest>(json, ContractJson.CamelCaseCompact)!;

        request.ArchitectureConcerns.Should().NotBeNull().And.BeEmpty();
    }
}
