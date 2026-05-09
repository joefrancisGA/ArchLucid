namespace ArchLucid.Persistence.Data.Repositories.LlmDailyTenantTokenWindow;

/// <summary>Outcome of a token increment against <see cref="ILlmDailyTenantTokenWindowStateRepository" />.</summary>
public sealed class LlmDailyTenantTokenWindowTokensUpdateResult
{
    public bool ConcurrencyConflict
    {
        get;
        init;
    }

    public bool ShouldEmitWarnAudit
    {
        get;
        init;
    }

    public LlmDailyTenantTokenWindowStateReadModel? NewState
    {
        get;
        init;
    }
}
