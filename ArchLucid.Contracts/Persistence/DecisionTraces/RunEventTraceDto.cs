using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Persistence.DecisionTraces;

[JsonConverter(typeof(DecisionTraceDtoJsonConverter))]
public sealed class RunEventTraceDto : DecisionTraceDto
{
    [JsonIgnore]
    public override DecisionTraceKind Kind => DecisionTraceKind.RunEvent;

    public required RunEventTracePayload RunEvent
    {
        get;
        set;
    }

    public static RunEventTraceDto From(RunEventTracePayload body)
    {
        return new RunEventTraceDto { RunEvent = body ?? throw new ArgumentNullException(nameof(body)) };
    }
}
