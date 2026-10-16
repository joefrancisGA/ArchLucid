using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Integrations;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Integrations;

[Trait("Category", "Unit")]
public sealed class TeamsIncomingWebhookSecretValidationOutcomeDeserializationTests
{
    [Fact]
    public void Deserialize_integer_out_of_range_outcome_throws()
    {
        const string json = """
            {
              "outcome": 99,
              "message": "probe failed"
            }
            """;

        Action act = () => JsonSerializer.Deserialize<TeamsIncomingWebhookSecretValidationResponse>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_defined_outcome()
    {
        const string json = """
            {
              "outcome": 0,
              "message": "ok"
            }
            """;

        TeamsIncomingWebhookSecretValidationResponse response =
            JsonSerializer.Deserialize<TeamsIncomingWebhookSecretValidationResponse>(json, ContractJson.Default)!;

        response.Outcome.Should().Be(TeamsIncomingWebhookSecretValidationOutcome.Found);
    }
}
