using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Runs;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Finalization;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunAssumptionAcknowledgementJsonTests
{
    [Fact]
    public void Serialize_then_TryDeserialize_round_trips_camel_case_document()
    {
        RunAssumptionAcknowledgementDocument document = new()
        {
            ActorUserId = "operator@example.test",
            AcknowledgedUtc = new DateTime(2026, 9, 11, 12, 0, 0, DateTimeKind.Utc),
            AcknowledgedAssumptionIds = ["assumption-1cvx8t", "assumption-abc"],
        };

        string json = RunAssumptionAcknowledgementJson.Serialize(document);
        RunAssumptionAcknowledgementDocument? parsed = RunAssumptionAcknowledgementJson.TryDeserialize(json);

        json.Should().Contain("\"acknowledgedAssumptionIds\"");
        parsed.Should().NotBeNull();
        parsed!.ActorUserId.Should().Be("operator@example.test");
        parsed.AcknowledgedUtc.Should().Be(document.AcknowledgedUtc);
        parsed.AcknowledgedAssumptionIds.Should().Equal("assumption-1cvx8t", "assumption-abc");
        parsed.EvaluationVersion.Should().Be(RunAssumptionAcknowledgementDocument.DocumentVersion);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("{not json")]
    public void TryDeserialize_returns_null_for_blank_or_malformed_json(string? json)
    {
        RunAssumptionAcknowledgementJson.TryDeserialize(json).Should().BeNull();
        RunAssumptionAcknowledgementJson.ReadAcknowledgedIds(json).Should().BeEmpty();
    }

    [Fact]
    public void ReadAcknowledgedIds_normalizes_persisted_ids()
    {
        string json = """{"acknowledgedAssumptionIds":[" assumption-a ","","assumption-a","assumption-b"]}""";

        HashSet<string> ids = RunAssumptionAcknowledgementJson.ReadAcknowledgedIds(json);

        ids.Should().BeEquivalentTo(["assumption-a", "assumption-b"]);
    }

    [Fact]
    public void NormalizeIds_is_ordinal_and_handles_null()
    {
        RunAssumptionAcknowledgementJson.NormalizeIds(null).Should().BeEmpty();
        RunAssumptionAcknowledgementJson.NormalizeIds(["Assumption-A", "assumption-a", " assumption-a"])
            .Should().BeEquivalentTo(["Assumption-A", "assumption-a"]);
    }

    [Fact]
    public void Serialize_rejects_null_document()
    {
        Action act = () => RunAssumptionAcknowledgementJson.Serialize(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
