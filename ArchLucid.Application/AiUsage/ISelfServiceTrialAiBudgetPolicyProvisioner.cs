namespace ArchLucid.Application.AiUsage;

/// <summary>
///     Applies the default hard AI-spend ceiling when a self-service trial tenant is provisioned.
/// </summary>
public interface ISelfServiceTrialAiBudgetPolicyProvisioner
{
    Task<bool> EnsureDefaultTrialPolicyIfAbsentAsync(
        Guid tenantId,
        DateTimeOffset trialExpirationUtc,
        CancellationToken cancellationToken = default);
}
