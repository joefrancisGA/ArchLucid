namespace ArchLucid.Core.Tenancy;

/// <summary>
///     Resolves mailbox recipients for scheduled executive summary emails (<see cref="ArchLucidRoles.Admin" /> and
///     <see cref="ArchLucidRoles.Sponsor" />).
/// </summary>
public interface IExecutiveSummaryRecipientLookup
{
    Task<IReadOnlyList<string>> ListRecipientMailboxesAsync(Guid tenantId, CancellationToken cancellationToken);
}
