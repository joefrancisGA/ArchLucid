using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditAssessmentRepository
{
    Task InsertAsync(AuditAssessmentRecord assessment, CancellationToken cancellationToken = default);

    Task InsertInScopeAsync(
        ProjectScopeKey scope,
        AuditAssessmentCreateMutation mutation,
        CancellationToken cancellationToken = default) =>
        InsertAsync(mutation.ToRecord(scope), cancellationToken);

    Task<AuditAssessmentRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default);

    async Task<AuditAssessmentRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        CancellationToken cancellationToken = default)
    {
        AuditAssessmentRecord? row = await TryGetByIdAsync(scope.TenantId, assessmentId, cancellationToken);
        return row is not null && scope.Matches(row.TenantId, row.WorkspaceId, row.ProjectId) ? row : null;
    }

    Task UpdateStatusAsync(
        Guid tenantId,
        Guid assessmentId,
        AuditAssessmentStatus status,
        CancellationToken cancellationToken = default);

    async Task UpdateStatusInScopeAsync(
        ProjectScopeKey scope,
        AuditAssessmentStatusMutation mutation,
        CancellationToken cancellationToken = default)
    {
        AuditAssessmentRecord? current = await TryGetByIdInScopeAsync(scope, mutation.AssessmentId, cancellationToken);
        if (current is null)
            return;

        await UpdateStatusAsync(scope.TenantId, mutation.AssessmentId, mutation.Status, cancellationToken);
    }

    Task<IReadOnlyList<AuditAssessmentRecord>> ListActiveByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<AuditAssessmentRecord>> ListActiveByScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<AuditAssessmentRecord> rows = await ListActiveByTenantAsync(scope.TenantId, cancellationToken);
        return rows.Where(row => scope.Matches(row.TenantId, row.WorkspaceId, row.ProjectId)).ToList();
    }
}

public sealed record AuditAssessmentCreateMutation
{
    public required Guid AssessmentId { get; init; }
    public required Guid FrameworkId { get; init; }
    public required string FrameworkVersion { get; init; }
    public required string ScopeJson { get; init; }
    public DateTime? PeriodStartUtc { get; init; }
    public DateTime? PeriodEndUtc { get; init; }
    public required AuditAssessmentStatus Status { get; init; }
    public required string RequestedBy { get; init; }
    public required DateTime CreatedUtc { get; init; }

    public AuditAssessmentRecord ToRecord(ProjectScopeKey scope) => new()
    {
        AssessmentId = AssessmentId,
        TenantId = scope.TenantId,
        WorkspaceId = scope.WorkspaceId,
        ProjectId = scope.ProjectId,
        FrameworkId = FrameworkId,
        FrameworkVersion = FrameworkVersion,
        ScopeJson = ScopeJson,
        PeriodStartUtc = PeriodStartUtc,
        PeriodEndUtc = PeriodEndUtc,
        Status = Status,
        RequestedBy = RequestedBy,
        CreatedUtc = CreatedUtc,
    };
}

public sealed record AuditAssessmentStatusMutation
{
    public required Guid AssessmentId { get; init; }
    public required AuditAssessmentStatus Status { get; init; }
}
