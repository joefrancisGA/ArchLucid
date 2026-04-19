using ArchLucid.Core.CustomerSuccess;

namespace ArchLucid.Persistence.CustomerSuccess;

/// <summary>In-memory no-op implementation for tests and offline hosts.</summary>
public sealed class InMemoryTenantCustomerSuccessRepository : ITenantCustomerSuccessRepository
{
    /// <inheritdoc />
    public Task<TenantHealthScoreRecord?> GetHealthScoreAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        _ = tenantId;
        _ = workspaceId;
        _ = projectId;
        _ = ct;

        return Task.FromResult<TenantHealthScoreRecord?>(null);
    }

    /// <inheritdoc />
    public Task InsertProductFeedbackAsync(ProductFeedbackSubmission submission, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(submission);
        _ = ct;

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task RefreshAllTenantHealthScoresAsync(CancellationToken ct)
    {
        _ = ct;

        return Task.CompletedTask;
    }
}
