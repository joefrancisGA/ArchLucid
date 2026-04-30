namespace ArchLucid.Application.DataConsistency;

public interface IDataConsistencyReconciliationService
{
    Task<DataConsistencyReport> RunReconciliationAsync(CancellationToken cancellationToken);
}
