using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>In-memory storage mode: no SCIM directory rows to resolve.</summary>
public sealed class NullExecutiveSummaryRecipientLookup : IExecutiveSummaryRecipientLookup
{
    /// <inheritdoc />
    public Task<IReadOnlyList<string>> ListRecipientMailboxesAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        _ = tenantId;
        _ = cancellationToken;
        return Task.FromResult<IReadOnlyList<string>>([]);
    }
}
