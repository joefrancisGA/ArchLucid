namespace ArchLucid.Core.Persistence.ApplicationPorts.FineTuning;

/// <summary>Persists manifest fine-tuning export audit rows.</summary>
public interface IFineTuningTrainingExportAuditRepository
{
    Task InsertAsync(FineTuningTrainingExportAuditRecord record, CancellationToken cancellationToken);
}
