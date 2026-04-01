using ArchiForge.Contracts.ProductLearning;

namespace ArchiForge.Persistence.ProductLearning;

/// <summary>
/// Persistence for <see cref="ProductLearningPilotSignalRecord"/> rows (SQL Server via Dapper in production).
/// </summary>
public interface IProductLearningPilotSignalRepository
{
    /// <summary>Inserts a signal. Assigns <see cref="ProductLearningPilotSignalRecord.SignalId"/> and <see cref="ProductLearningPilotSignalRecord.RecordedUtc"/> when unset/default.</summary>
    Task InsertAsync(ProductLearningPilotSignalRecord record, CancellationToken cancellationToken);

    /// <summary>Latest signals for a tenant/workspace/project scope, newest first.</summary>
    Task<IReadOnlyList<ProductLearningPilotSignalRecord>> ListRecentForScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken cancellationToken);
}
