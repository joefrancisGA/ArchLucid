using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Shared decision-trace repository rules for SQL and in-memory <see cref="IDecisionTraceRepository" /> implementations.
/// </summary>
public static class DecisionTraceRepositoryCore
{
    public const int MaxInMemoryEntries = 500;

    public const string SelectColumns = """
        TenantId, WorkspaceId, ProjectId,
        DecisionTraceId, RunId, CreatedUtc,
        RuleSetId, RuleSetVersion, RuleSetHash,
        AppliedRuleIdsJson, AcceptedFindingIdsJson, RequiredFindingIdsJson,
        AllowedFindingIdsJson, PreferredFindingIdsJson, RejectedFindingIdsJson, NotesJson,
        ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, PromptRefsJson, WarningsJson
        """;

    public const string InsertSql = """
        INSERT INTO dbo.DecisioningTraces
        (
            TenantId, WorkspaceId, ProjectId,
            DecisionTraceId, RunId, CreatedUtc,
            RuleSetId, RuleSetVersion, RuleSetHash,
            AppliedRuleIdsJson, AcceptedFindingIdsJson, RequiredFindingIdsJson,
            AllowedFindingIdsJson, PreferredFindingIdsJson, RejectedFindingIdsJson, NotesJson,
            ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, PromptRefsJson, WarningsJson
        )
        VALUES
        (
            @TenantId, @WorkspaceId, @ProjectId,
            @DecisionTraceId, @RunId, @CreatedUtc,
            @RuleSetId, @RuleSetVersion, @RuleSetHash,
            @AppliedRuleIdsJson, @AcceptedFindingIdsJson, @RequiredFindingIdsJson,
            @AllowedFindingIdsJson, @PreferredFindingIdsJson, @RejectedFindingIdsJson, @NotesJson,
            @ContextSnapshotId, @GraphSnapshotId, @FindingsSnapshotId, @PromptRefsJson, @WarningsJson
        );
        """;

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

    public static object CreateInsertArgs(RuleAuditTracePayload audit)
    {
        ArgumentNullException.ThrowIfNull(audit);

        return new
        {
            audit.TenantId,
            audit.WorkspaceId,
            audit.ProjectId,
            audit.DecisionTraceId,
            audit.RunId,
            audit.CreatedUtc,
            audit.RuleSetId,
            audit.RuleSetVersion,
            audit.RuleSetHash,
            AppliedRuleIdsJson = JsonEntitySerializer.Serialize(audit.AppliedRuleIds),
            AcceptedFindingIdsJson = JsonEntitySerializer.Serialize(audit.AcceptedFindingIds),
            RequiredFindingIdsJson = JsonEntitySerializer.Serialize(audit.RequiredFindingIds),
            AllowedFindingIdsJson = JsonEntitySerializer.Serialize(audit.AllowedFindingIds),
            PreferredFindingIdsJson = JsonEntitySerializer.Serialize(audit.PreferredFindingIds),
            RejectedFindingIdsJson = JsonEntitySerializer.Serialize(audit.RejectedFindingIds),
            NotesJson = JsonEntitySerializer.Serialize(audit.Notes),
            audit.ContextSnapshotId,
            audit.GraphSnapshotId,
            audit.FindingsSnapshotId,
            PromptRefsJson = JsonEntitySerializer.Serialize(audit.PromptRefs),
            WarningsJson = JsonEntitySerializer.Serialize(audit.Warnings),
        };
    }

    public static DecisionTraceDto MapRow(DecisionTraceRow row)
    {
        ArgumentNullException.ThrowIfNull(row);

        return RuleAuditTraceDto.From(new RuleAuditTracePayload
        {
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
            DecisionTraceId = row.DecisionTraceId,
            RunId = row.RunId,
            CreatedUtc = row.CreatedUtc,
            RuleSetId = row.RuleSetId,
            RuleSetVersion = row.RuleSetVersion,
            RuleSetHash = row.RuleSetHash,
            AppliedRuleIds = DeserializeStringList(row.AppliedRuleIdsJson),
            AcceptedFindingIds = DeserializeStringList(row.AcceptedFindingIdsJson),
            RequiredFindingIds = DeserializeStringList(row.RequiredFindingIdsJson),
            AllowedFindingIds = DeserializeStringList(row.AllowedFindingIdsJson),
            PreferredFindingIds = DeserializeStringList(row.PreferredFindingIdsJson),
            RejectedFindingIds = DeserializeStringList(row.RejectedFindingIdsJson),
            Notes = DeserializeStringList(row.NotesJson),
            ContextSnapshotId = row.ContextSnapshotId,
            GraphSnapshotId = row.GraphSnapshotId,
            FindingsSnapshotId = row.FindingsSnapshotId,
            PromptRefs = DeserializePromptRefs(row.PromptRefsJson),
            Warnings = DeserializeWarnings(row.WarningsJson),
        });
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

    private static List<string> DeserializeStringList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            return JsonEntitySerializer.Deserialize<List<string>>(json) ?? [];
        }
        catch (InvalidOperationException)
        {
            return [];
        }
    }

    private static List<RuleAuditTracePromptRef> DeserializePromptRefs(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            return JsonEntitySerializer.Deserialize<List<RuleAuditTracePromptRef>>(json) ?? [];
        }
        catch (InvalidOperationException)
        {
            return [];
        }
    }

    private static List<RuleAuditTraceWarning> DeserializeWarnings(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            return JsonEntitySerializer.Deserialize<List<RuleAuditTraceWarning>>(json) ?? [];
        }
        catch (InvalidOperationException)
        {
            return [];
        }
    }
}

/// <summary>SQL row shape for <see cref="DecisionTraceRepositoryCore.MapRow" />.</summary>
public sealed class DecisionTraceRow
{
    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public Guid ProjectId
    {
        get;
        init;
    }

    public Guid DecisionTraceId
    {
        get;
        init;
    }

    public Guid RunId
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public string RuleSetId
    {
        get;
        init;
    } = null!;

    public string RuleSetVersion
    {
        get;
        init;
    } = null!;

    public string RuleSetHash
    {
        get;
        init;
    } = null!;

    public string AppliedRuleIdsJson
    {
        get;
        init;
    } = null!;

    public string AcceptedFindingIdsJson
    {
        get;
        init;
    } = null!;

    public string? RequiredFindingIdsJson
    {
        get;
        init;
    }

    public string? AllowedFindingIdsJson
    {
        get;
        init;
    }

    public string? PreferredFindingIdsJson
    {
        get;
        init;
    }

    public string RejectedFindingIdsJson
    {
        get;
        init;
    } = null!;

    public string NotesJson
    {
        get;
        init;
    } = null!;

    public Guid? ContextSnapshotId
    {
        get;
        init;
    }

    public Guid? GraphSnapshotId
    {
        get;
        init;
    }

    public Guid? FindingsSnapshotId
    {
        get;
        init;
    }

    public string? PromptRefsJson
    {
        get;
        init;
    }

    public string? WarningsJson
    {
        get;
        init;
    }
}
