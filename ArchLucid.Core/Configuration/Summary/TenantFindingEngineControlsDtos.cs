namespace ArchLucid.Core.Configuration.Summary;

public sealed class TenantFindingEngineControlsResponse
{
    public bool EffectiveEnableLlmJudge { get; set; }

    public bool EffectiveEnableLlmJudgeForEngineFindings { get; set; }

    public bool EffectivePortfolioRecurrenceEnabled { get; set; }

    public bool HostDefaultEnableLlmJudge { get; set; }

    public bool HostDefaultEnableLlmJudgeForEngineFindings { get; set; }

    public bool HostDefaultPortfolioRecurrenceEnabled { get; set; }

    public bool EnableLlmJudgeOverridden { get; set; }

    public bool EnableLlmJudgeForEngineFindingsOverridden { get; set; }

    public bool PortfolioRecurrenceEnabledOverridden { get; set; }
}

public sealed class TenantFindingEngineControlsUpdateRequest
{
    public bool EnableLlmJudge { get; set; }

    public bool EnableLlmJudgeForEngineFindings { get; set; }

    public bool PortfolioRecurrenceEnabled { get; set; }
}
