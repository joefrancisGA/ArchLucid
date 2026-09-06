using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationInstances;

public sealed class RemediationInstanceSummary
{
    public Guid InstanceId
    {
        get;
        init;
    }

    public Guid FindingId
    {
        get;
        init;
    }

    public string PatternKey
    {
        get;
        init;
    } = string.Empty;

    public RemediationInstanceStatus Status
    {
        get;
        init;
    }

    public RemediationAutomationLevel AutomationLevel
    {
        get;
        init;
    }

    public Guid? CloudResourceId
    {
        get;
        init;
    }

    public Guid? WaveId
    {
        get;
        init;
    }

    public Guid? PreflightSnapshotId
    {
        get;
        init;
    }

    public Guid? ExecutionSnapshotId
    {
        get;
        init;
    }

    public Guid? VerificationSnapshotId
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public DateTime UpdatedUtc
    {
        get;
        init;
    }
}

public sealed class RemediationInstanceEvidenceSummary
{
    public Guid EvidenceId
    {
        get;
        init;
    }

    public RemediationEvidencePhase Phase
    {
        get;
        init;
    }

    public string PayloadJson
    {
        get;
        init;
    } = string.Empty;

    public DateTime CreatedUtc
    {
        get;
        init;
    }
}

public sealed class RemediationInstanceDetail
{
    public RemediationInstanceSummary Instance
    {
        get;
        init;
    } = null!;

    public OperationalSecurityFindingRecord? Finding
    {
        get;
        init;
    }

    public RemediationPatternMatchResultRecord? ActiveMatch
    {
        get;
        init;
    }

    public IReadOnlyList<RemediationInstanceEvidenceSummary> Evidence
    {
        get;
        init;
    } = [];
}

public interface IRemediationInstanceQueryService
{
    Task<IReadOnlyList<RemediationInstanceSummary>> ListInstancesAsync(
        ScopeContext scope,
        Guid? cloudResourceId = null,
        Guid? findingId = null,
        CancellationToken cancellationToken = default);

    Task<RemediationInstanceDetail?> TryGetInstanceAsync(
        ScopeContext scope,
        Guid instanceId,
        CancellationToken cancellationToken = default);
}

public sealed class RemediationInstanceQueryService(
    IRemediationInstanceRepository instanceRepository,
    IOperationalSecurityFindingRepository findingRepository,
    IRemediationPatternMatchRepository matchRepository) : IRemediationInstanceQueryService
{
    public async Task<IReadOnlyList<RemediationInstanceSummary>> ListInstancesAsync(
        ScopeContext scope,
        Guid? cloudResourceId = null,
        Guid? findingId = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        IReadOnlyList<RemediationInstanceRecord> instances;

        if (findingId is Guid scopedFindingId && scopedFindingId != Guid.Empty)
        {
            instances = await instanceRepository.ListByFindingIdAsync(
                scope.TenantId,
                scopedFindingId,
                cancellationToken);

            if (cloudResourceId is Guid resourceId && resourceId != Guid.Empty)
            {
                instances = instances
                    .Where(item => item.CloudResourceId == resourceId)
                    .ToList();
            }
        }
        else if (cloudResourceId is Guid resourceId && resourceId != Guid.Empty)
        {
            (IReadOnlyList<RemediationInstanceRecord> items, _) =
                await instanceRepository.ListByCloudResourceIdPagedAsync(
                    scope.TenantId,
                    resourceId,
                    PaginationDefaults.DefaultPage,
                    PaginationDefaults.MaxPageSize,
                    cancellationToken);

            instances = items;
        }
        else
        {
            instances = await instanceRepository.ListByTenantAsync(scope.TenantId, cancellationToken);
        }

        return instances
            .OrderByDescending(item => item.UpdatedUtc)
            .Select(MapSummary)
            .ToList();
    }

    public async Task<RemediationInstanceDetail?> TryGetInstanceAsync(
        ScopeContext scope,
        Guid instanceId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RemediationInstanceRecord? instance =
            await instanceRepository.TryGetByIdAsync(scope.TenantId, instanceId, cancellationToken);

        if (instance is null || instance.TenantId != scope.TenantId)
            return null;

        OperationalSecurityFindingRecord? finding =
            await findingRepository.TryGetByIdAsync(scope.TenantId, instance.FindingId, cancellationToken);

        RemediationPatternMatchResultRecord? activeMatch =
            await matchRepository.TryGetActiveMatchAsync(scope.TenantId, instance.FindingId, cancellationToken);

        IReadOnlyList<RemediationEvidenceRecord> evidence =
            await instanceRepository.ListEvidenceByInstanceAsync(scope.TenantId, instanceId, cancellationToken);

        return new RemediationInstanceDetail
        {
            Instance = MapSummary(instance),
            Finding = finding,
            ActiveMatch = activeMatch,
            Evidence = evidence
                .OrderBy(item => item.CreatedUtc)
                .Select(item => new RemediationInstanceEvidenceSummary
                {
                    EvidenceId = item.EvidenceId,
                    Phase = item.Phase,
                    PayloadJson = item.PayloadJson,
                    CreatedUtc = item.CreatedUtc,
                })
                .ToList(),
        };
    }

    private static RemediationInstanceSummary MapSummary(RemediationInstanceRecord instance) =>
        new()
        {
            InstanceId = instance.InstanceId,
            FindingId = instance.FindingId,
            PatternKey = instance.PatternKey,
            Status = instance.Status,
            AutomationLevel = instance.AutomationLevel,
            CloudResourceId = instance.CloudResourceId,
            WaveId = instance.WaveId,
            PreflightSnapshotId = instance.PreflightSnapshotId,
            ExecutionSnapshotId = instance.ExecutionSnapshotId,
            VerificationSnapshotId = instance.VerificationSnapshotId,
            CreatedUtc = instance.CreatedUtc,
            UpdatedUtc = instance.UpdatedUtc,
        };
}
