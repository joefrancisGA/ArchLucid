using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IOperationalSecurityFindingIngestService
{
    Task<OperationalSecurityFindingBatchIngestResult> IngestBatchAsync(
        ScopeContext scope,
        IReadOnlyList<OperationalSecurityFindingIngestItem> items,
        string actorId,
        CancellationToken cancellationToken = default);

    Task<OperationalSecurityFindingDetailResult> TryGetDetailAsync(
        ScopeContext scope,
        Guid findingId,
        CancellationToken cancellationToken = default);
}

public sealed class OperationalSecurityFindingIngestItem
{
    public CloudProvider Provider
    {
        get;
        init;
    }

    public string SourceSystem
    {
        get;
        init;
    } = string.Empty;

    public string SourceFindingId
    {
        get;
        init;
    } = string.Empty;

    public Guid? CloudResourceId
    {
        get;
        init;
    }

    public string? ExternalResourceId
    {
        get;
        init;
    }

    public string? ResourceType
    {
        get;
        init;
    }

    public string? SubscriptionOrAccountId
    {
        get;
        init;
    }

    public string? ControlId
    {
        get;
        init;
    }

    public string? ControlFramework
    {
        get;
        init;
    }

    public string Title
    {
        get;
        init;
    } = string.Empty;

    public string? Description
    {
        get;
        init;
    }

    public string? Severity
    {
        get;
        init;
    }

    public decimal? RiskScore
    {
        get;
        init;
    }

    public string? Exploitability
    {
        get;
        init;
    }

    public string? Exposure
    {
        get;
        init;
    }

    public string? BusinessCriticality
    {
        get;
        init;
    }

    public string? BlastRadius
    {
        get;
        init;
    }

    public DateTime? ObservedUtc
    {
        get;
        init;
    }

    public OperationalSecurityFindingStatus Status
    {
        get;
        init;
    } = OperationalSecurityFindingStatus.Open;

    public string? RawEvidenceReference
    {
        get;
        init;
    }

    public Guid? AssessmentId
    {
        get;
        init;
    }

    public Guid? InventoryDiffId
    {
        get;
        init;
    }

    public Guid? AuditEvidenceSnapshotId
    {
        get;
        init;
    }

    public IReadOnlyDictionary<string, string?> Metadata
    {
        get;
        init;
    } = new Dictionary<string, string?>();
}

public sealed class OperationalSecurityFindingBatchIngestResult
{
    public IReadOnlyList<OperationalSecurityFindingIngestItemResult> Items
    {
        get;
        init;
    } = [];

    public int IngestedCount
    {
        get;
        init;
    }

    public int DeduplicatedCount
    {
        get;
        init;
    }

    public int FailedCount
    {
        get;
        init;
    }
}

public sealed class OperationalSecurityFindingIngestItemResult
{
    public int Index
    {
        get;
        init;
    }

    public bool Succeeded
    {
        get;
        init;
    }

    public bool WasDeduplicated
    {
        get;
        init;
    }

    public Guid? FindingId
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }
}

public sealed class OperationalSecurityFindingDetailResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public OperationalSecurityFindingRecord? Finding
    {
        get;
        init;
    }

    public IReadOnlyList<OperationalSecurityFindingMetadataRecord> Metadata
    {
        get;
        init;
    } = [];

    public IReadOnlyList<OperationalSecurityFindingObservationRecord> Observations
    {
        get;
        init;
    } = [];

    public string? ErrorMessage
    {
        get;
        init;
    }
}
