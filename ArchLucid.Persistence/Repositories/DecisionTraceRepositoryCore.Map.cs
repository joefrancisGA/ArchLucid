using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Persistence.DecisionTraces;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.Repositories;

public static partial class DecisionTraceRepositoryCore
{
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

    public static DecisionTraceDto Clone(DecisionTraceDto source) =>
        DecisionTraceStoreRules.Clone(source);

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
