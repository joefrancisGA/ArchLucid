namespace ArchLucid.Application.Configuration;

/// <summary>
///     Tenant overrides for the insight-density flags whose effective value depends on execution mode.
/// </summary>
/// <remarks>
///     Grouped into one object so <see cref="InsightDensityGateEffectiveOptionsMerger.ApplyExecutionModePolicy" />
///     does not take a positional pair of booleans per flag, where a transposed argument would silently resolve the
///     wrong flag.
/// </remarks>
public sealed class InsightDensityTenantFlagOverrides
{
    public InsightDensityTenantFlagOverride LlmJudge
    {
        get;
        init;
    } = InsightDensityTenantFlagOverride.Absent;

    public InsightDensityTenantFlagOverride LlmJudgeForEngineFindings
    {
        get;
        init;
    } = InsightDensityTenantFlagOverride.Absent;

    public InsightDensityTenantFlagOverride InsightGenerator
    {
        get;
        init;
    } = InsightDensityTenantFlagOverride.Absent;

    public InsightDensityTenantFlagOverride PreferHighNoveltyEngines
    {
        get;
        init;
    } = InsightDensityTenantFlagOverride.Absent;

    public InsightDensityTenantFlagOverride PreferHighVerificationEngines
    {
        get;
        init;
    } = InsightDensityTenantFlagOverride.Absent;

    public InsightDensityTenantFlagOverride ProseAssumptionExtraction
    {
        get;
        init;
    } = InsightDensityTenantFlagOverride.Absent;

    /// <summary>No tenant scope, or a tenant that has stored nothing — every flag inherits the mode default.</summary>
    public static InsightDensityTenantFlagOverrides None { get; } = new();
}
