using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Persistence.DecisionTraces;

[JsonConverter(typeof(DecisionTraceDtoJsonConverter))]
public abstract class DecisionTraceDto
{
    public abstract DecisionTraceKind Kind
    {
        get;
    }

    /// <summary>Requires a coordinator merge/agent step trace.</summary>
    public RunEventTracePayload RequireRunEvent()
    {
        if (this is RunEventTraceDto runEvent)
            return runEvent.RunEvent;

        throw new InvalidOperationException("Expected a RunEvent trace (coordinator pipeline).");
    }

    /// <summary>Requires an authority rule-audit trace.</summary>
    public RuleAuditTracePayload RequireRuleAudit()
    {
        if (this is RuleAuditTraceDto ruleAudit)
            return ruleAudit.RuleAudit;

        throw new InvalidOperationException("Expected a RuleAudit trace (authority pipeline).");
    }
}
