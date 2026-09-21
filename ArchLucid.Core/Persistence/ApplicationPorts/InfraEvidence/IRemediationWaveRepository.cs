using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IRemediationWaveRepository
{
    Task InsertWaveAsync(RemediationWaveRecord wave, CancellationToken cancellationToken = default);

    Task InsertWaveInScopeAsync(
        ProjectScopeKey scope,
        RemediationWaveCreateMutation mutation,
        CancellationToken cancellationToken = default) =>
        InsertWaveAsync(mutation.ToRecord(scope), cancellationToken);

    Task UpdateWaveAsync(RemediationWaveRecord wave, CancellationToken cancellationToken = default);

    async Task UpdateWaveInScopeAsync(
        ProjectScopeKey scope,
        RemediationWaveMutation mutation,
        CancellationToken cancellationToken = default)
    {
        RemediationWaveRecord? current =
            await TryGetByIdInScopeAsync(scope, mutation.WaveId, cancellationToken);
        if (current is null)
            return;

        await UpdateWaveAsync(mutation.ApplyTo(current), cancellationToken);
    }

    Task<RemediationWaveRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid waveId,
        CancellationToken cancellationToken = default);

    async Task<RemediationWaveRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid waveId,
        CancellationToken cancellationToken = default)
    {
        RemediationWaveRecord? row = await TryGetByIdAsync(scope.TenantId, waveId, cancellationToken);
        return row is not null && scope.Matches(row.TenantId, row.WorkspaceId, row.ProjectId) ? row : null;
    }

    Task<IReadOnlyList<RemediationWaveRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<RemediationWaveRecord>> ListByScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<RemediationWaveRecord> rows = await ListByTenantAsync(scope.TenantId, cancellationToken);
        return rows.Where(row => scope.Matches(row.TenantId, row.WorkspaceId, row.ProjectId)).ToList();
    }

    Task InsertMemberAsync(RemediationWaveMemberRecord member, CancellationToken cancellationToken = default);

    Task InsertMemberInScopeAsync(
        ProjectScopeKey scope,
        RemediationWaveMemberMutation mutation,
        CancellationToken cancellationToken = default) =>
        InsertMemberAsync(mutation.ToRecord(scope), cancellationToken);

    Task<IReadOnlyList<RemediationWaveMemberRecord>> ListMembersByWaveAsync(
        Guid tenantId,
        Guid waveId,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<RemediationWaveMemberRecord>> ListMembersByWaveInScopeAsync(
        ProjectScopeKey scope,
        Guid waveId,
        CancellationToken cancellationToken = default)
    {
        RemediationWaveRecord? wave = await TryGetByIdInScopeAsync(scope, waveId, cancellationToken);
        return wave is null
            ? []
            : await ListMembersByWaveAsync(scope.TenantId, waveId, cancellationToken);
    }
}

public sealed record RemediationWaveCreateMutation
{
    public required Guid WaveId { get; init; }
    public required string Name { get; init; }
    public int? TargetSize { get; init; }
    public required RemediationWaveStatus Status { get; init; }
    public required string CreatedByActorKey { get; init; }
    public required DateTime CreatedUtc { get; init; }
    public required DateTime UpdatedUtc { get; init; }

    public RemediationWaveRecord ToRecord(ProjectScopeKey scope) => new()
    {
        WaveId = WaveId,
        TenantId = scope.TenantId,
        WorkspaceId = scope.WorkspaceId,
        ProjectId = scope.ProjectId,
        Name = Name,
        TargetSize = TargetSize,
        Status = Status,
        CreatedByActorKey = CreatedByActorKey,
        CreatedUtc = CreatedUtc,
        UpdatedUtc = UpdatedUtc,
    };
}

public sealed record RemediationWaveMutation
{
    public required Guid WaveId { get; init; }
    public required string Name { get; init; }
    public int? TargetSize { get; init; }
    public required RemediationWaveStatus Status { get; init; }
    public required DateTime UpdatedUtc { get; init; }

    public RemediationWaveRecord ApplyTo(RemediationWaveRecord source) => new()
    {
        WaveId = source.WaveId,
        TenantId = source.TenantId,
        WorkspaceId = source.WorkspaceId,
        ProjectId = source.ProjectId,
        Name = Name,
        TargetSize = TargetSize,
        Status = Status,
        CreatedByActorKey = source.CreatedByActorKey,
        CreatedUtc = source.CreatedUtc,
        UpdatedUtc = UpdatedUtc,
    };
}

public sealed record RemediationWaveMemberMutation
{
    public required Guid MemberId { get; init; }
    public required Guid WaveId { get; init; }
    public required Guid FindingId { get; init; }
    public Guid? InstanceId { get; init; }
    public Guid? CloudResourceId { get; init; }
    public required int PriorityRank { get; init; }
    public required decimal PriorityScore { get; init; }
    public required DateTime CreatedUtc { get; init; }

    public RemediationWaveMemberRecord ToRecord(ProjectScopeKey scope) => new()
    {
        MemberId = MemberId,
        WaveId = WaveId,
        TenantId = scope.TenantId,
        FindingId = FindingId,
        InstanceId = InstanceId,
        CloudResourceId = CloudResourceId,
        PriorityRank = PriorityRank,
        PriorityScore = PriorityScore,
        CreatedUtc = CreatedUtc,
    };
}
