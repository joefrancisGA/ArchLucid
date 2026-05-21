using ArchLucid.Core.Authorization;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>
///     Active SCIM users mapped to <see cref="ArchLucidRoles.Admin" /> or <see cref="ArchLucidRoles.Sponsor" />, with
///     audit-based admin fallback when no directory users exist.
/// </summary>
public sealed class DapperExecutiveSummaryRecipientLookup(
    ISqlConnectionFactory connectionFactory,
    ITenantTrialEmailContactLookup trialEmailContactLookup) : IExecutiveSummaryRecipientLookup
{
    private static readonly string[] RecipientRoles =
    [
        ArchLucidRoles.Admin,
        ArchLucidRoles.Sponsor,
        ArchLucidRoles.WorkspaceAdmin,
    ];

    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly ITenantTrialEmailContactLookup _trialEmailContactLookup =
        trialEmailContactLookup ?? throw new ArgumentNullException(nameof(trialEmailContactLookup));

    /// <inheritdoc />
    public async Task<IReadOnlyList<string>> ListRecipientMailboxesAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT DISTINCT UserName
                           FROM dbo.ScimUsers
                           WHERE TenantId = @TenantId
                             AND Active = 1
                             AND DirectoryRemovedUtc IS NULL
                             AND ResolvedRole IN @Roles
                             AND UserName LIKE '%@%';
                           """;

        IEnumerable<string> rows = await connection.QueryAsync<string>(
            new CommandDefinition(sql, new { TenantId = tenantId, Roles = RecipientRoles }, cancellationToken: cancellationToken));

        HashSet<string> mailboxes = new(StringComparer.OrdinalIgnoreCase);

        foreach (string row in rows)
        {
            if (string.IsNullOrWhiteSpace(row))
                continue;

            mailboxes.Add(row.Trim());
        }

        if (mailboxes.Count == 0)
        {
            string? fallback = await _trialEmailContactLookup.TryResolveAdminEmailAsync(tenantId, cancellationToken)
                .ConfigureAwait(false);

            if (!string.IsNullOrWhiteSpace(fallback))
                mailboxes.Add(fallback.Trim());
        }

        return mailboxes.OrderBy(static m => m, StringComparer.OrdinalIgnoreCase).ToArray();
    }
}
