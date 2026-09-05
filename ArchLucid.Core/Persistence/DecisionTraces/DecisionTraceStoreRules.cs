using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.DecisionTraces;

/// <summary>
///     Shared in-memory decision-trace store rules. Lives in Core so Decisioning adapters
///     do not take a Persistence assembly dependency.
/// </summary>
public static class DecisionTraceStoreRules
{
    public const int MaxInMemoryEntries = 500;

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

    public static DecisionTraceDto Clone(DecisionTraceDto source)
    {
        ArgumentNullException.ThrowIfNull(source);

        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        DecisionTraceDto? copy = JsonSerializer.Deserialize<DecisionTraceDto>(json, ContractJson.Default);

        return copy ?? throw new InvalidOperationException("Clone produced null DecisionTraceDto.");
    }

    public static void TrimInMemoryEntries<T>(List<T> entries)
    {
        ArgumentNullException.ThrowIfNull(entries);

        if (entries.Count > MaxInMemoryEntries)
            entries.RemoveRange(0, entries.Count - MaxInMemoryEntries);
    }
}
