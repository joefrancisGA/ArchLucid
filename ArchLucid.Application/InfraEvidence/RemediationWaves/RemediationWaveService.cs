using ArchLucid.Application.InfraEvidence.RemediationPrioritization;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationWaves;

public sealed class RemediationWaveOperationResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? WaveId
    {
        get;
        init;
    }

    public int MemberCount
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

public sealed class RemediationWaveDetail
{
    public RemediationWaveRecord Wave
    {
        get;
        init;
    } = null!;

    public IReadOnlyList<RemediationWaveMemberRecord> Members
    {
        get;
        init;
    } = [];
}

public interface IRemediationWaveService
{
    Task<RemediationWaveOperationResult> CreateWaveAsync(
        ScopeContext scope,
        string name,
        int? targetSize,
        IReadOnlyList<Guid>? explicitCloudResourceIds,
        string actorKey,
        CancellationToken cancellationToken = default);

    Task<RemediationWaveDetail?> GetWaveAsync(
        ScopeContext scope,
        Guid waveId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RemediationWaveRecord>> ListWavesAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);
}

public sealed class RemediationWaveService(
    IRemediationWaveRepository waveRepository,
    IRemediationPrioritizationService prioritizationService,
    IRemediationInstanceService instanceService,
    IRemediationInstanceRepository instanceRepository) : IRemediationWaveService
{
    public async Task<RemediationWaveOperationResult> CreateWaveAsync(
        ScopeContext scope,
        string name,
        int? targetSize,
        IReadOnlyList<Guid>? explicitCloudResourceIds,
        string actorKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(name))
            return Failed("Wave name is required.");

        if (string.IsNullOrWhiteSpace(actorKey))
            return Failed("ActorKey is required.");

        bool hasExplicitResources = explicitCloudResourceIds is { Count: > 0 };
        bool hasTargetSize = targetSize.HasValue;

        if (!hasExplicitResources && !hasTargetSize)
            return Failed("Either targetSize or explicitCloudResourceIds is required.");

        if (hasTargetSize && targetSize!.Value <= 0)
            return Failed("targetSize must be a positive integer.");

        if (hasExplicitResources && hasTargetSize)
            return Failed("Provide targetSize or explicitCloudResourceIds, not both.");

        IReadOnlyList<RemediationPrioritizedFinding> ranked = await prioritizationService.RankOpenFindingsAsync(
            scope,
            actorKey,
            cancellationToken);

        IEnumerable<RemediationPrioritizedFinding> candidates = ranked;

        if (hasExplicitResources)
        {
            HashSet<Guid> resourceSet = explicitCloudResourceIds!.ToHashSet();

            candidates = ranked.Where(item =>
                item.CloudResourceId.HasValue && resourceSet.Contains(item.CloudResourceId.Value));
        }
        else
        {
            candidates = ranked.Take(targetSize!.Value);
        }

        List<RemediationPrioritizedFinding> selected = candidates.ToList();

        if (selected.Count == 0)
            return Failed("No findings matched the wave criteria.");

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        Guid waveId = Guid.NewGuid();

        RemediationWaveRecord wave = new()
        {
            WaveId = waveId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            Name = name.Trim(),
            TargetSize = hasTargetSize ? targetSize : selected.Count,
            Status = RemediationWaveStatus.Active,
            CreatedByActorKey = actorKey.Trim(),
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        await waveRepository.InsertWaveAsync(wave, cancellationToken);

        int rank = 1;

        foreach (RemediationPrioritizedFinding finding in selected)
        {
            RemediationInstanceRecord? approvedInstance = (await instanceRepository.ListByTenantAsync(scope.TenantId, cancellationToken))
                .Where(item =>
                    item.FindingId == finding.FindingId
                    && item.Status == RemediationInstanceStatus.Approved)
                .OrderByDescending(item => item.UpdatedUtc)
                .FirstOrDefault();

            RemediationWaveMemberRecord member = new()
            {
                MemberId = Guid.NewGuid(),
                WaveId = waveId,
                TenantId = scope.TenantId,
                FindingId = finding.FindingId,
                InstanceId = approvedInstance?.InstanceId,
                CloudResourceId = finding.CloudResourceId,
                PriorityRank = rank++,
                PriorityScore = finding.TotalScore,
                CreatedUtc = utcNow,
            };

            await waveRepository.InsertMemberAsync(member, cancellationToken);

            if (approvedInstance is not null)
            {
                await instanceService.AssignWaveAsync(scope, approvedInstance.InstanceId, waveId, actorKey, cancellationToken);
            }
        }

        return new RemediationWaveOperationResult
        {
            Succeeded = true,
            WaveId = waveId,
            MemberCount = selected.Count,
        };
    }

    public async Task<RemediationWaveDetail?> GetWaveAsync(
        ScopeContext scope,
        Guid waveId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RemediationWaveRecord? wave = await waveRepository.TryGetByIdAsync(scope.TenantId, waveId, cancellationToken);

        if (wave is null)
            return null;

        IReadOnlyList<RemediationWaveMemberRecord> members =
            await waveRepository.ListMembersByWaveAsync(scope.TenantId, waveId, cancellationToken);

        return new RemediationWaveDetail
        {
            Wave = wave,
            Members = members,
        };
    }

    public async Task<IReadOnlyList<RemediationWaveRecord>> ListWavesAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return await waveRepository.ListByTenantAsync(scope.TenantId, cancellationToken);
    }

    private static RemediationWaveOperationResult Failed(string message) =>
        new() { Succeeded = false, ErrorMessage = message };
}
