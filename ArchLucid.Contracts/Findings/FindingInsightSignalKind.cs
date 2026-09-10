using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>Operator insight-density instrumentation on the finding desk (DX-13).</summary>
[JsonConverter(typeof(JsonStringEnumConverter<FindingInsightSignalKind>))]
public enum FindingInsightSignalKind
{
    DidNotThinkOfThat = 0,
    Expected = 1,
    DismissAsChecklist = 2,
}
