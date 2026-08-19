using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Persistence.Governance;

/// <summary>
///     Thread-safe in-memory store for <see cref="PolicyPackAssignment" /> used when <c>StorageProvider=InMemory</c> or in
///     unit tests.
/// </summary>
/// <remarks>
///     <para>
///         <strong>List semantics:</strong> Must mirror
///         <see cref="DapperPolicyPackAssignmentRepository.ListByScopeAsync" /> so Decisioning behavior is identical
///         between SQL and in-memory hosts.
///     </para>
///     <para>
///         Registered as singleton in in-memory storage bootstrap via <c>ArchLucid.Host.Composition</c> (
///         <c>ArchLucidStorageServiceCollectionExtensions</c>).
///     </para>
/// </remarks>
public sealed class InMemoryPolicyPackAssignmentRepository : IPolicyPackAssignmentRepository
{
    private readonly ILogger<InMemoryPolicyPackAssignmentRepository> _logger;

    /// <summary>Initializes the store without logging (tests / direct construction).</summary>
    public InMemoryPolicyPackAssignmentRepository()
        : this(NullLogger<InMemoryPolicyPackAssignmentRepository>.Instance)
    {
    }

    public InMemoryPolicyPackAssignmentRepository(ILogger<InMemoryPolicyPackAssignmentRepository> logger)
    {
        ArgumentNullException.ThrowIfNull(logger);
        _logger = logger;
    }

    private const int MaxEntries = 2_000;
    private readonly Lock _gate = new();

    private readonly List<PolicyPackAssignment> _items = [];

    /// <inheritdoc />
    public Task CreateAsync(PolicyPackAssignment assignment, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(assignment);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            if (_items.Count >= MaxEntries)
                _items.RemoveAt(0);

            _items.Add(assignment);
        }

        _logger.LogInformationPolicyPackAssignmentAssigned(assignment.PolicyPackId, assignment.TenantId,
            assignment.WorkspaceId);

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task UpdateAsync(PolicyPackAssignment assignment, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(assignment);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            int i = _items.FindIndex(x => x.AssignmentId == assignment.AssignmentId);
            if (i >= 0)
                _items[i] = assignment;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    /// <remarks>Excludes non-matching scope tiers; does not filter <see cref="PolicyPackAssignment.IsEnabled" /> here.</remarks>
    public Task<IReadOnlyList<PolicyPackAssignment>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<PolicyPackAssignment> result = _items
                .Where(x => x.TenantId == tenantId)
                .Where(x => !x.ArchivedUtc.HasValue)
                .Where(x =>
                    string.Equals(x.ScopeLevel, GovernanceScopeLevel.Tenant, StringComparison.Ordinal) ||
                    (string.Equals(x.ScopeLevel, GovernanceScopeLevel.Workspace, StringComparison.Ordinal) &&
                     x.WorkspaceId == workspaceId) ||
                    (string.Equals(x.ScopeLevel, GovernanceScopeLevel.Project, StringComparison.Ordinal) &&
                     x.WorkspaceId == workspaceId && x.ProjectId == projectId))
                .OrderByDescending(x => x.AssignedUtc)
                .ToList();
            return Task.FromResult<IReadOnlyList<PolicyPackAssignment>>(result);
        }
    }

    /// <inheritdoc />
    public Task<PolicyPackAssignment?> GetByTenantAndAssignmentIdAsync(Guid tenantId, Guid assignmentId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            PolicyPackAssignment? row =
                _items.FirstOrDefault(x => x.TenantId == tenantId && x.AssignmentId == assignmentId);

            return Task.FromResult(row);
        }
    }

    /// <inheritdoc />
    public Task<bool> ArchiveAsync(Guid tenantId, Guid assignmentId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        Guid policyPackIdCaptured = Guid.Empty;
        Guid tenantCaptured = Guid.Empty;
        Guid workspaceCaptured = Guid.Empty;
        bool mutated = false;

        lock (_gate)
        {
            PolicyPackAssignment? row = _items.FirstOrDefault(x =>
                x.AssignmentId == assignmentId && x.TenantId == tenantId && !x.ArchivedUtc.HasValue);
            if (row is null)
                return Task.FromResult(false);

            policyPackIdCaptured = row.PolicyPackId;
            tenantCaptured = row.TenantId;
            workspaceCaptured = row.WorkspaceId;
            row.ArchivedUtc = TimeProvider.System.UtcNowDateTime();
            mutated = true;
        }

        if (mutated)
            _logger.LogInformationPolicyPackAssignmentUnassigned(policyPackIdCaptured, tenantCaptured,
                workspaceCaptured);

        return Task.FromResult(true);
    }
}
