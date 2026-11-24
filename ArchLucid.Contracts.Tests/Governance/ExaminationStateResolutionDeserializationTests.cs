using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Posture;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ExaminationStateResolutionDeserializationTests
{
    [Fact]
    public void Deserialize_null_reason_text_yields_empty_string_not_null()
    {
        const string json = """
            {
              "state": 0,
              "reasonText": null
            }
            """;

        ExaminationStateResolution? result =
            JsonSerializer.Deserialize<ExaminationStateResolution>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ReasonText.Should().BeEmpty();
    }

    [Theory]
    [InlineData("{}", PillarExaminationState.Unavailable)]
    [InlineData("{\"state\":0}", PillarExaminationState.Examined)]
    [InlineData("{\"state\":1}", PillarExaminationState.PartiallyExamined)]
    [InlineData("{\"state\":2}", PillarExaminationState.NotExamined)]
    [InlineData("{\"state\":3}", PillarExaminationState.Unavailable)]
    public void Deserialize_state_defaults_to_unavailable_only_when_missing(
        string json, PillarExaminationState expected)
    {
        ExaminationStateResolution? result =
            JsonSerializer.Deserialize<ExaminationStateResolution>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.State.Should().Be(expected);
    }
}
