using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Persistence.DecisionTraces;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Repositories;

public static partial class DecisionTraceRepositoryCore
{
    public static RuleAuditTracePayload RequireRuleAudit(DecisionTraceDto trace) =>
        DecisionTraceStoreRules.RequireRuleAudit(trace);

    public static bool MatchesScope(RuleAuditTracePayload audit, ScopeContext scope) =>
        DecisionTraceStoreRules.MatchesScope(audit, scope);

    public static bool MatchesIdAndScope(RuleAuditTraceDto trace, ScopeContext scope, Guid decisionTraceId) =>
        DecisionTraceStoreRules.MatchesIdAndScope(trace, scope, decisionTraceId);
}
