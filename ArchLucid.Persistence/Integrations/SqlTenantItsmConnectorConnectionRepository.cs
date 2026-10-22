using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Integrations;

/// <inheritdoc cref="ITenantItsmConnectorConnectionRepository" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via ArchLucid.sql / DbUp and integration tests.")]
public sealed partial class SqlTenantItsmConnectorConnectionRepository(ISqlConnectionFactory connectionFactory)
    : ITenantItsmConnectorConnectionRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private static TenantItsmConnectorConnectionRecord ToRecord(Row row) =>
        TenantItsmConnectorConnectionRepositoryCore.MapFromSqlRow(
            row.TenantId,
            row.Provider,
            row.InstanceBaseUrl,
            row.AuthMode,
            row.AuthUserName,
            row.CredentialKeyVaultSecretName,
            row.OAuthClientIdKeyVaultSecretName,
            row.OAuthClientSecretKeyVaultSecretName,
            row.OAuthRefreshTokenKeyVaultSecretName,
            row.InboundWebhookKeyVaultSecretName,
            row.IsEnabled,
            row.Label,
            row.UpdatedUtc);

    private sealed class Row
    {
        public Guid TenantId
        {
            get;
            init;
        }

        public string Provider
        {
            get;
            init;
        } = "";

        public string InstanceBaseUrl
        {
            get;
            init;
        } = "";

        public string AuthMode
        {
            get;
            init;
        } = TenantItsmConnectorConnectionUpsertValidation.ToAuthModeLabel(ItsmConnectorAuthMode.BasicApiToken);

        public string AuthUserName
        {
            get;
            init;
        } = "";

        public string CredentialKeyVaultSecretName
        {
            get;
            init;
        } = "";

        public string? OAuthClientIdKeyVaultSecretName
        {
            get;
            init;
        }

        public string? OAuthClientSecretKeyVaultSecretName
        {
            get;
            init;
        }

        public string? OAuthRefreshTokenKeyVaultSecretName
        {
            get;
            init;
        }

        public string? InboundWebhookKeyVaultSecretName
        {
            get;
            init;
        }

        public bool IsEnabled
        {
            get;
            init;
        }

        public string? Label
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }
    }
}
