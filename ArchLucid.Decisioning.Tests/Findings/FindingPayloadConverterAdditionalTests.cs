using System.Text.Json;

using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingPayloadConverterAdditionalTests
{
    [Fact]
    public void ConvertPayload_NullFinding_ThrowsArgumentNullException()
    {
        Action act = () => FindingPayloadConverter.ConvertPayload<RequirementFindingPayload>(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("finding");
    }

    [Fact]
    public void ConvertPayload_NullPayload_ReturnsDefault()
    {
        Finding finding = new()
        {
            FindingId = "id-1",
            Payload = null
        };

        RequirementFindingPayload? result = FindingPayloadConverter.ConvertPayload<RequirementFindingPayload>(finding);

        result.Should().BeNull();
    }

    [Fact]
    public void ConvertPayload_JsonElement_DeserializesCorrectly()
    {
        RequirementFindingPayload source = new()
        {
            RequirementName = "N",
            RequirementText = "T",
            IsMandatory = true
        };
        JsonElement element = JsonSerializer.SerializeToElement(source);

        Finding finding = new()
        {
            FindingId = "id-json",
            Payload = element
        };

        RequirementFindingPayload? result = FindingPayloadConverter.ConvertPayload<RequirementFindingPayload>(finding);

        result.Should().NotBeNull();
        result.RequirementName.Should().Be("N");
        result.RequirementText.Should().Be("T");
        result.IsMandatory.Should().BeTrue();
    }

    [Fact]
    public void ConvertPayload_AnonymousObject_RoundTripsThroughJson()
    {
        object payload = new
        {
            RequirementName = "FromAnon",
            RequirementText = "Text",
            IsMandatory = false
        };

        Finding finding = new()
        {
            FindingId = "id-anon",
            Payload = payload
        };

        RequirementFindingPayload? result = FindingPayloadConverter.ConvertPayload<RequirementFindingPayload>(finding);

        result.Should().NotBeNull();
        result.RequirementName.Should().Be("FromAnon");
        result.RequirementText.Should().Be("Text");
        result.IsMandatory.Should().BeFalse();
    }

    [Fact]
    public void ConvertPayload_CorruptJsonElement_ThrowsInvalidOperationException()
    {
        JsonElement corrupt = JsonSerializer.SerializeToElement(42);

        Finding finding = new()
        {
            FindingId = "bad-payload",
            Payload = corrupt
        };

        Action act = () => FindingPayloadConverter.ConvertPayload<RequirementFindingPayload>(finding);

        act.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*RequirementFindingPayload*FindingId=bad-payload*");
    }

    [Fact]
    public void ConvertPayload_WithMarkdownWrappedJsonString_StripsMarkdownAndDeserializes()
    {
        const string markdownPayload =
            """
            ```json
            {
              "requirementName": "MarkdownWrapped",
              "requirementText": "From fenced block",
              "isMandatory": true
            }
            ```
            """;

        Finding finding = new()
        {
            FindingId = "markdown-string",
            Payload = markdownPayload,
        };

        RequirementFindingPayload? result = FindingPayloadConverter.ConvertPayload<RequirementFindingPayload>(finding);

        result.Should().NotBeNull();
        result!.RequirementName.Should().Be("MarkdownWrapped");
        result.RequirementText.Should().Be("From fenced block");
        result.IsMandatory.Should().BeTrue();
    }

    [Fact]
    public void ConvertPayload_WithRawJsonString_Deserializes()
    {
        const string rawJson =
            """
            {"requirementName":"RawJson","requirementText":"Direct string payload","isMandatory":false}
            """;

        Finding finding = new()
        {
            FindingId = "raw-json-string",
            Payload = rawJson,
        };

        RequirementFindingPayload? result = FindingPayloadConverter.ConvertPayload<RequirementFindingPayload>(finding);

        result.Should().NotBeNull();
        result!.RequirementName.Should().Be("RawJson");
        result.RequirementText.Should().Be("Direct string payload");
        result.IsMandatory.Should().BeFalse();
    }

    [Fact]
    public void ConvertPayload_WithNumbersAsStrings_Deserializes()
    {
        const string rawJson =
            """
            {"budgetName":"prod","maxMonthlyCost":"12500","costRisk":"medium"}
            """;

        Finding finding = new()
        {
            FindingId = "numeric-strings",
            Payload = rawJson,
        };

        CostConstraintFindingPayload? result = FindingPayloadConverter.ConvertPayload<CostConstraintFindingPayload>(finding);

        result.Should().NotBeNull();
        result!.BudgetName.Should().Be("prod");
        result.MaxMonthlyCost.Should().Be(12500m);
        result.CostRisk.Should().Be("medium");
    }

    [Fact]
    public void ConvertPayload_WithTrailingCommas_Deserializes()
    {
        const string rawJson =
            """
            {
              "requirementName": "TrailingComma",
              "requirementText": "Tolerates trailing comma",
              "isMandatory": true,
            }
            """;

        Finding finding = new()
        {
            FindingId = "trailing-comma",
            Payload = rawJson,
        };

        RequirementFindingPayload? result = FindingPayloadConverter.ConvertPayload<RequirementFindingPayload>(finding);

        result.Should().NotBeNull();
        result!.RequirementName.Should().Be("TrailingComma");
    }

    [Fact]
    public void ConvertPayload_JsonElementStringPayload_UnwrapsAndDeserializes()
    {
        const string rawJson =
            """
            {"requirementName":"Embedded","requirementText":"JsonElement string kind","isMandatory":true}
            """;

        JsonElement element = JsonSerializer.SerializeToElement(rawJson);

        Finding finding = new()
        {
            FindingId = "json-element-string",
            Payload = element,
        };

        RequirementFindingPayload? result = FindingPayloadConverter.ConvertPayload<RequirementFindingPayload>(finding);

        result.Should().NotBeNull();
        result!.RequirementName.Should().Be("Embedded");
    }
}
