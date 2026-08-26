namespace ArchLucid.Application.Tenancy;

public interface ITenantFindingEngineControlsService
{
    Task<TenantFindingEngineControlsSnapshot> GetAsync(CancellationToken cancellationToken);

    Task<TenantFindingEngineControlsSnapshot> SetAsync(
        bool enableLlmJudge,
        bool enableLlmJudgeForEngineFindings,
        bool portfolioRecurrenceEnabled,
        CancellationToken cancellationToken);

    Task<TenantFindingEngineControlsSnapshot> ClearOverridesAsync(CancellationToken cancellationToken);
}
