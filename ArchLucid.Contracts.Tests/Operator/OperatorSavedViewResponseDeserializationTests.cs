using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Operator;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Operator;

[Trait("Category", "Unit")]
public sealed class OperatorSavedViewResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_payload_yields_non_null_payload_not_null()
    {
        const string json = """
            {
              "id": "00000000-0000-0000-0000-000000000001",
              "payload": null
            }
            """;

        OperatorSavedViewResponse? response =
            JsonSerializer.Deserialize<OperatorSavedViewResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.Payload.Should().NotBeNull();
    }
}
