using ArchLucid.Application.InfraEvidence.RemediationWaves;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationMetrics;

public sealed class RemediationWaveProgressSummary
{
    public Guid WaveId
    {
        get;
        init;
    }

    public string Name
    {
        get;
        init;
    } = string.Empty;

    public RemediationWaveStatus Status
    {
        get;
        init;
    }

    public int MemberCount
    {
        get;
        init;
    }

    public int? TargetSize
    {
        get;
        init;
    }
}

public sealed class RemediationFactoryWorkbenchSummary
{
    public RemediationFactoryMetrics FactoryMetrics
    {
        get;
        init;
    } = null!;

    public IReadOnlyDictionary<string, int> OpenInstancesByStatus
    {
        get;
        init;
    } = new Dictionary<string, int>();

    public IReadOnlyList<RemediationWaveProgressSummary> Waves
    {
        get;
        init;
    } = [];
}

public interface IRemediationFactoryWorkbenchQueryService
{
    Task<RemediationFactoryWorkbenchSummary> GetSummaryAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);
}

public sealed class RemediationFactoryWorkbenchQueryService(
    IRemediationFactoryMetricsService metricsService,
    IRemediationInstanceRepository instanceRepository,
    IRemediationWaveService waveService) : IRemediationFactoryWorkbenchQueryService
{
    public async Task<RemediationFactoryWorkbenchSummary> GetSummaryAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RemediationFactoryMetrics metrics = await metricsService.GetMetricsAsync(scope, cancellationToken);

        IReadOnlyList<RemediationInstanceRecord> instances =
            await instanceRepository.ListByTenantAsync(scope.TenantId, cancellationToken);

        Dictionary<string, int> openInstancesByStatus = instances
            .Where(item => item.Status != RemediationInstanceStatus.Closed)
            .GroupBy(item => item.Status.ToString())
            .ToDictionary(group => group.Key, group => group.Count());

        IReadOnlyList<RemediationWaveRecord> waves = await waveService.ListWavesAsync(scope, cancellationToken);
        List<RemediationWaveProgressSummary> waveSummaries = [];

        foreach (RemediationWaveRecord wave in waves.OrderByDescending(item => item.UpdatedUtc))
        {
            RemediationWaveDetail? detail = await waveService.GetWaveAsync(scope, wave.WaveId, cancellationToken);

            waveSummaries.Add(new RemediationWaveProgressSummary
            {
                WaveId = wave.WaveId,
                Name = wave.Name,
                Status = wave.Status,
                MemberCount = detail?.Members.Count ?? 0,
                TargetSize = wave.TargetSize,
            });
        }

        return new RemediationFactoryWorkbenchSummary
        {
            FactoryMetrics = metrics,
            OpenInstancesByStatus = openInstancesByStatus,
            Waves = waveSummaries,
        };
    }
}
