using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Operations;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Operations;

[Trait("Category", "Unit")]
public sealed class OperationStateDeserializationTests
{
    [Fact]
    public void Deserialize_integer_out_of_range_state_throws()
    {
        const string json = """
            {
              "operationId": "op-1",
              "state": 99,
              "stepLabel": "step",
              "heartbeatUtc": "2026-10-14T00:00:00Z"
            }
            """;

        Action act = () => JsonSerializer.Deserialize<OperationDetail>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_string_numeric_out_of_range_state_throws()
    {
        const string json = """
            {
              "operationId": "op-1",
              "state": "99",
              "stepLabel": "step",
              "heartbeatUtc": "2026-10-14T00:00:00Z"
            }
            """;

        Action act = () => JsonSerializer.Deserialize<OperationDetail>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_defined_state()
    {
        const string json = """
            {
              "operationId": "op-1",
              "state": 2,
              "stepLabel": "done",
              "heartbeatUtc": "2026-10-14T00:00:00Z"
            }
            """;

        OperationDetail detail = JsonSerializer.Deserialize<OperationDetail>(json, ContractJson.Default)!;

        detail.State.Should().Be(OperationState.Succeeded);
    }
}
