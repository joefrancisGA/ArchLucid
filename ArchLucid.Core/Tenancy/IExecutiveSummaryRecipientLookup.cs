namespace ArchLucid.Core.Tenancy;

/// <summary>
///     Resolves mailbox recipients for scheduled Sponsor report emails (<see cref="ArchLucidRoles.Admin" /> and
///     <see cref="ArchLucidRoles.Sponsor" />).
/// </summary>
public interface ISponsorReportRecipientLookup
{
    Task<IReadOnlyList<string>> ListRecipientMailboxesAsync(Guid tenantId, CancellationToken cancellationToken);
}
