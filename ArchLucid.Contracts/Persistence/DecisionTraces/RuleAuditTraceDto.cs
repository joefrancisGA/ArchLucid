using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Persistence.DecisionTraces;

[JsonConverter(typeof(DecisionTraceDtoJsonConverter))]
public sealed class RuleAuditTraceDto : DecisionTraceDto
{
    [JsonIgnore]
    public override DecisionTraceKind Kind => DecisionTraceKind.RuleAudit;

    public required RuleAuditTracePayload RuleAudit
    {
        get;
        set;
    }

    public static RuleAuditTraceDto From(RuleAuditTracePayload body)
    {
        return new RuleAuditTraceDto { RuleAudit = body ?? throw new ArgumentNullException(nameof(body)) };
    }
}
