using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Repositories;

public static partial class DecisionTraceRepositoryCore
{
    public static RuleAuditTracePayload RequireRuleAudit(DecisionTraceDto trace)
    {
        ArgumentNullException.ThrowIfNull(trace);

        if (trace is not RuleAuditTraceDto ruleAuditTrace)
            throw new InvalidOperationException("Expected a RuleAudit trace (authority pipeline).");

        return ruleAuditTrace.RuleAudit;
    }

    public static bool MatchesScope(RuleAuditTracePayload audit, ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(audit);
        ArgumentNullException.ThrowIfNull(scope);

        return audit.TenantId == scope.TenantId
               && audit.WorkspaceId == scope.WorkspaceId
               && audit.ProjectId == scope.ProjectId;
    }

    public static bool MatchesIdAndScope(RuleAuditTraceDto trace, ScopeContext scope, Guid decisionTraceId)
    {
        ArgumentNullException.ThrowIfNull(trace);
        ArgumentNullException.ThrowIfNull(scope);

        return trace.RuleAudit.DecisionTraceId == decisionTraceId
               && MatchesScope(trace.RuleAudit, scope);
    }
}
