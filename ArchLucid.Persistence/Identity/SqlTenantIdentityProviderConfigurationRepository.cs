using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

[ExcludeFromCodeCoverage(Justification = "SQL integration; covered via API tests.")]
public sealed class SqlTenantIdentityProviderConfigurationRepository(
    ISqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations) : ITenantIdentityProviderConfigurationRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    public Task<TenantIdentityProviderConfigurationRecord?> TryGetAsync(
        Guid tenantId,
        CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => TryGetCoreAsync(tenantId, ct), cancellationToken);

    public Task UpsertAsync(TenantIdentityProviderConfigurationRecord record, CancellationToken cancellationToken) =>
        _sqlOperations.ExecuteAsync(ct => UpsertCoreAsync(record, ct), cancellationToken);

    private async Task<TenantIdentityProviderConfigurationRecord?> TryGetCoreAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        const string sql = """
                             SELECT TenantId,
                                    Protocol,
                                    IssuerUri,
                                    MetadataXml,
                                    ClaimMappingJson,
                                    KeyVaultSecretName,
                                    UpdatedUtc,
                                    UpdatedByActorId,
                                    IsActive
                             FROM dbo.TenantIdentityProviderConfigurations
                             WHERE TenantId = @TenantId;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        Row? row = await connection.QuerySingleOrDefaultAsync<Row>(
                new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return row?.ToRecord();
    }

    private async Task UpsertCoreAsync(
        TenantIdentityProviderConfigurationRecord record,
        CancellationToken cancellationToken)
    {
        if (record.TenantId == Guid.Empty)
            throw new ArgumentException("TenantId is required.", nameof(record));

        ArgumentException.ThrowIfNullOrWhiteSpace(record.IssuerUri);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.ClaimMappingJson);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.UpdatedByActorId);

        const string sql = """
                             MERGE dbo.TenantIdentityProviderConfigurations AS target
                             USING (SELECT @TenantId AS TenantId) AS source
                             ON target.TenantId = source.TenantId
                             WHEN MATCHED THEN
                                 UPDATE SET
                                     Protocol = @Protocol,
                                     IssuerUri = @IssuerUri,
                                     MetadataXml = @MetadataXml,
                                     ClaimMappingJson = @ClaimMappingJson,
                                     KeyVaultSecretName = @KeyVaultSecretName,
                                     UpdatedUtc = SYSUTCDATETIME(),
                                     UpdatedByActorId = @UpdatedByActorId,
                                     IsActive = @IsActive
                             WHEN NOT MATCHED THEN
                                 INSERT (TenantId, Protocol, IssuerUri, MetadataXml, ClaimMappingJson,
                                         KeyVaultSecretName, UpdatedUtc, UpdatedByActorId, IsActive)
                                 VALUES (@TenantId, @Protocol, @IssuerUri, @MetadataXml, @ClaimMappingJson,
                                         @KeyVaultSecretName, SYSUTCDATETIME(), @UpdatedByActorId, @IsActive);
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        record.TenantId,
                        Protocol = ToProtocolString(record.Protocol),
                        record.IssuerUri,
                        record.MetadataXml,
                        record.ClaimMappingJson,
                        record.KeyVaultSecretName,
                        record.UpdatedByActorId,
                        record.IsActive
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }

    private static string ToProtocolString(TenantIdentityProtocol protocol) =>
        protocol switch
        {
            TenantIdentityProtocol.Oidc => "oidc",
            TenantIdentityProtocol.Saml => "saml",
            _ => throw new ArgumentOutOfRangeException(nameof(protocol), protocol, "Unsupported protocol.")
        };

    private sealed class Row
    {
        public Guid TenantId { get; init; }

        public string Protocol { get; init; } = string.Empty;

        public string IssuerUri { get; init; } = string.Empty;

        public string? MetadataXml { get; init; }

        public string ClaimMappingJson { get; init; } = string.Empty;

        public string? KeyVaultSecretName { get; init; }

        public DateTimeOffset UpdatedUtc { get; init; }

        public string UpdatedByActorId { get; init; } = string.Empty;

        public bool IsActive { get; init; }

        public TenantIdentityProviderConfigurationRecord ToRecord()
        {
            TenantIdentityProtocol protocol = Protocol.Trim().ToLowerInvariant() switch
            {
                "oidc" => TenantIdentityProtocol.Oidc,
                "saml" => TenantIdentityProtocol.Saml,
                _ => throw new InvalidOperationException($"Unknown protocol '{Protocol}'.")
            };

            return new TenantIdentityProviderConfigurationRecord
            {
                TenantId = TenantId,
                Protocol = protocol,
                IssuerUri = IssuerUri,
                MetadataXml = MetadataXml,
                ClaimMappingJson = ClaimMappingJson,
                KeyVaultSecretName = KeyVaultSecretName,
                UpdatedUtc = UpdatedUtc,
                UpdatedByActorId = UpdatedByActorId,
                IsActive = IsActive
            };
        }
    }
}
