namespace ArchLucid.Core.Agents;

public interface IProviderQualityMonitor
{
    Task<ProviderQualityAdmission> AdmitAsync(string? providerId, string? modelId, CancellationToken cancellationToken);

    Task<ProviderQualityRecordResult> RecordAsync(ProviderQualityAdjudication sample, CancellationToken cancellationToken);

    Task<bool> SetOperatorOverrideAsync(
        ProviderQualityKey key,
        TimeSpan? duration,
        Guid auditEventId,
        CancellationToken cancellationToken);

    Task BindRecoveryTraceAsync(ProviderQualityKey key, Guid leaseId, string traceId, CancellationToken cancellationToken);
}
