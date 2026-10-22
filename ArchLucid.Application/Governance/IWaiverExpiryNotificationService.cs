namespace ArchLucid.Application.Governance;

/// <summary>Scheduled waiver / risk-exception expiry pass for one tenant (TB-2193).</summary>
public interface IWaiverExpiryNotificationService
{
    /// <summary>
    ///     Makes expiry authoritative for the tenant and sends any reminders whose cadence boundary has been entered
    ///     and not already sent. Returns the number of reminders actually dispatched.
    /// </summary>
    Task<int> RunTenantPassAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
