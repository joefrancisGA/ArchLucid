namespace ArchLucid.Core.Billing;

/// <summary>Enforces billing readiness before <c>POST /v1/tenant/convert</c> marks a trial converted.</summary>
public interface IBillingTrialConversionGate
{
    /// <exception cref="InvalidOperationException">When configured billing requires an active paid row but none exists.</exception>
    Task EnsureManualConversionAllowedAsync(Guid tenantId, CancellationToken cancellationToken);
}
