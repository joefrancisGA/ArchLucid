using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Operator;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Operator;

[Trait("Category", "Unit")]
public sealed class CreateOperatorSavedViewRequestDeserializationTests
{
    [Fact]
    public void Deserialize_null_payload_yields_non_null_payload_not_null()
    {
        const string json = """
            {
              "surface": "runs",
              "name": "My view",
              "payload": null
            }
            """;

        CreateOperatorSavedViewRequest? request =
            JsonSerializer.Deserialize<CreateOperatorSavedViewRequest>(json, ContractJson.CamelCaseCompact);

        request.Should().NotBeNull();
        request!.Payload.Should().NotBeNull();
    }
}
