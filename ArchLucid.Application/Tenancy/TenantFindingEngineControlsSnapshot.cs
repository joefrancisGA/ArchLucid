namespace ArchLucid.Application.Tenancy;

public sealed record TenantFindingEngineControlsSnapshot(
    bool EffectiveEnableLlmJudge,
    bool EffectiveEnableLlmJudgeForEngineFindings,
    bool EffectivePortfolioRecurrenceEnabled,
    bool HostDefaultEnableLlmJudge,
    bool HostDefaultEnableLlmJudgeForEngineFindings,
    bool HostDefaultPortfolioRecurrenceEnabled,
    bool EnableLlmJudgeOverridden,
    bool EnableLlmJudgeForEngineFindingsOverridden,
    bool PortfolioRecurrenceEnabledOverridden);
