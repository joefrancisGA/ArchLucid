using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Marketing;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Marketing;

/// <inheritdoc />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository.")]
public sealed class SqlMarketingEarlyAccessRequestRepository(ISqlConnectionFactory connectionFactory)
    : IMarketingEarlyAccessRequestRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<MarketingEarlyAccessRequestInsertResult?> AppendAsync(
        string email,
        string? companyName,
        string? role,
        string? utmSource,
        string? utmMedium,
        string? utmCampaign,
        byte[]? clientIpSha256,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required.", nameof(email));

        const string sql = """
                           INSERT INTO dbo.MarketingEarlyAccessRequests (Email, CompanyName, Role, UtmSource, UtmMedium, UtmCampaign, ClientIpHash)
                           OUTPUT INSERTED.Id, INSERTED.CreatedUtc
                           VALUES (@Email, @CompanyName, @Role, @UtmSource, @UtmMedium, @UtmCampaign, @ClientIpHash);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        CommandDefinition cmd = new(
            sql,
            new
            {
                Email = email.Trim(),
                CompanyName = string.IsNullOrWhiteSpace(companyName) ? null : companyName.Trim(),
                Role = string.IsNullOrWhiteSpace(role) ? null : role.Trim(),
                UtmSource = string.IsNullOrWhiteSpace(utmSource) ? null : utmSource.Trim(),
                UtmMedium = string.IsNullOrWhiteSpace(utmMedium) ? null : utmMedium.Trim(),
                UtmCampaign = string.IsNullOrWhiteSpace(utmCampaign) ? null : utmCampaign.Trim(),
                ClientIpHash = clientIpSha256
            },
            cancellationToken: cancellationToken);

        (Guid Id, DateTime CreatedUtc) row =
            await connection.QuerySingleAsync<(Guid Id, DateTime CreatedUtc)>(cmd).ConfigureAwait(false);

        return new MarketingEarlyAccessRequestInsertResult(row.Id, row.CreatedUtc);
    }
}
