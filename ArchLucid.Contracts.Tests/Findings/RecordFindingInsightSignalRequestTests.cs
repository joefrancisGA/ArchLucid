using System.Text.Json;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RecordFindingInsightSignalRequestTests
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    [Fact]
    public void Deserialize_MissingKind_RejectsRequest()
    {
        Assert.Throws<JsonException>(() =>
            JsonSerializer.Deserialize<RecordFindingInsightSignalRequest>("{}", Options));
    }

    [Theory]
    [InlineData("DidNotThinkOfThat", FindingInsightSignalKind.DidNotThinkOfThat)]
    [InlineData("Expected", FindingInsightSignalKind.Expected)]
    [InlineData("DismissAsChecklist", FindingInsightSignalKind.DismissAsChecklist)]
    public void Deserialize_ExplicitKind_PreservesSelection(string name, FindingInsightSignalKind expected)
    {
        string json = JsonSerializer.Serialize(new { kind = name }, Options);
        var result = JsonSerializer.Deserialize<RecordFindingInsightSignalRequest>(json, Options);
        Assert.NotNull(result);
        Assert.Equal(expected, result!.Kind);
    }

    [Fact]
    public void Deserialize_ExplicitZero_PreservesNoveltySignal()
    {
        var result = JsonSerializer.Deserialize<RecordFindingInsightSignalRequest>(
            """{"kind":0}""", Options);
        Assert.NotNull(result);
        Assert.Equal(FindingInsightSignalKind.DidNotThinkOfThat, result!.Kind);
    }
}
