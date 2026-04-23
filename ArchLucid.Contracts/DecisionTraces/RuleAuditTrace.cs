using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.DecisionTraces;

/// <summary>
///     Authority pipeline trace: rule-application audit from the decision engine.
///     Persisted relationally (e.g. <c>DecisioningTraces</c>), not the coordinator <c>DecisionTraces</c> table.
/// </summary>
[JsonConverter(typeof(DecisionTraceJsonConverter))]
public sealed class RuleAuditTrace : DecisionTrace
{
    /// <inheritdoc />
    [JsonIgnore]
    public override DecisionTraceKind Kind => DecisionTraceKind.RuleAudit;

    /// <summary>Rule audit payload (finding accept/reject, applied rule ids).</summary>
    public required RuleAuditTracePayload RuleAudit
    {
        get;
        set;
    }

    public static RuleAuditTrace From(RuleAuditTracePayload body)
    {
        return new RuleAuditTrace { RuleAudit = body ?? throw new ArgumentNullException(nameof(body)) };
    }
}
