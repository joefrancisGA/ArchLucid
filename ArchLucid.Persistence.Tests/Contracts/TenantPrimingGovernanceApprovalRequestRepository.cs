using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Re-applies <see cref="SqlServerPersistenceFixture.PrimeGovernanceContractTenantAsync" /> before each
///     <see cref="IGovernanceApprovalRequestRepository.CreateAsync" /> so shared CI databases cannot drop the FK parent
///     between repository construction and the first insert (parallel jobs, purges, or long gaps).
/// </summary>
internal sealed class TenantPrimingGovernanceApprovalRequestRepository : IGovernanceApprovalRequestRepository
{
    private readonly string _connectionString;
    private readonly GovernanceApprovalRequestRepository _inner;

    public TenantPrimingGovernanceApprovalRequestRepository(
        string connectionString,
        IScopeContextProvider scopeContextProvider)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);
        ArgumentNullException.ThrowIfNull(scopeContextProvider);

        _connectionString = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(connectionString.Trim());
        _inner = new GovernanceApprovalRequestRepository(
            new RlsBypassTestDbConnectionFactory(_connectionString),
            scopeContextProvider);
    }

    /// <inheritdoc />
    public async Task CreateAsync(GovernanceApprovalRequest item, CancellationToken cancellationToken = default)
    {
        await SqlServerPersistenceFixture.PrimeGovernanceContractTenantAsync(_connectionString, cancellationToken);

        try
        {
            await _inner.CreateAsync(item, cancellationToken);
        }
        catch (SqlException ex) when (IsGovernanceApprovalTenantsFkViolation(ex))
        {
            await SqlServerPersistenceFixture.PrimeGovernanceContractTenantAsync(_connectionString, cancellationToken);

            await _inner.CreateAsync(item, cancellationToken);
        }
    }

    /// <inheritdoc />
    public Task<bool> TryTransitionFromReviewableAsync(
        string approvalRequestId,
        string newStatus,
        string reviewedBy,
        string? reviewedByActorKey,
        string? reviewComment,
        DateTime reviewedUtc,
        CancellationToken cancellationToken = default) =>
        _inner.TryTransitionFromReviewableAsync(
            approvalRequestId,
            newStatus,
            reviewedBy,
            reviewedByActorKey,
            reviewComment,
            reviewedUtc,
            cancellationToken);

    /// <inheritdoc />
    public Task UpdateAsync(GovernanceApprovalRequest item, CancellationToken cancellationToken = default) =>
        _inner.UpdateAsync(item, cancellationToken);

    /// <inheritdoc />
    public Task<GovernanceApprovalRequest?> GetByIdAsync(string approvalRequestId,
        CancellationToken cancellationToken = default) =>
        _inner.GetByIdAsync(approvalRequestId, cancellationToken);

    /// <inheritdoc />
    public Task<IReadOnlyList<GovernanceApprovalRequest>> GetByRunIdAsync(string runId,
        CancellationToken cancellationToken = default) =>
        _inner.GetByRunIdAsync(runId, cancellationToken);

    /// <inheritdoc />
    public Task<IReadOnlyList<GovernanceApprovalRequest>> GetPendingAsync(int maxRows = 50,
        CancellationToken cancellationToken = default) =>
        _inner.GetPendingAsync(maxRows, cancellationToken);

    /// <inheritdoc />
    public Task<IReadOnlyList<GovernanceApprovalRequest>> GetRecentDecisionsAsync(int maxRows = 50,
        CancellationToken cancellationToken = default) =>
        _inner.GetRecentDecisionsAsync(maxRows, cancellationToken);

    /// <inheritdoc />
    public Task<IReadOnlyList<GovernanceApprovalRequest>> GetPendingSlaBreachedAsync(DateTime utcNow,
        CancellationToken cancellationToken = default) =>
        _inner.GetPendingSlaBreachedAsync(utcNow, cancellationToken);

    /// <inheritdoc />
    public Task PatchSlaBreachNotifiedAsync(string approvalRequestId, DateTime slaBreachNotifiedUtc,
        CancellationToken cancellationToken = default) =>
        _inner.PatchSlaBreachNotifiedAsync(approvalRequestId, slaBreachNotifiedUtc, cancellationToken);

    /// <summary>
    ///     FK 547 after a successful prime usually means the parent row vanished on a shared catalog or priming hit a
    ///     different pool endpoint; one re-prime + retry matches other governance contract mitigations.
    /// </summary>
    private static bool IsGovernanceApprovalTenantsFkViolation(SqlException ex)
    {
        if (ex.Number != 547)
            return false;

        return ex.Message.Contains("FK_GovernanceApprovalRequests_Tenants", StringComparison.Ordinal);
    }
}
