using System.Collections.Concurrent;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

namespace ArchLucid.Persistence.Integrations;

/// <inheritdoc cref="ITenantItsmConnectorConnectionRepository" />
[ExcludeFromCodeCoverage(Justification = "In-memory test/dev store.")]
public sealed class InMemoryTenantItsmConnectorConnectionRepository : ITenantItsmConnectorConnectionRepository
{
    private readonly ConcurrentDictionary<(Guid TenantId, TenantItsmConnectorProvider Provider), TenantItsmConnectorConnectionRecord> _store =
        new();

    public Task<IReadOnlyList<TenantItsmConnectorConnectionRecord>> ListAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        IReadOnlyList<TenantItsmConnectorConnectionRecord> rows = _store.Values
            .Where(r => r.TenantId == tenantId)
            .OrderBy(r => r.Provider)
            .ToList();

        return Task.FromResult(rows);
    }

    public Task<TenantItsmConnectorConnectionRecord?> GetAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        CancellationToken cancellationToken)
    {
        _store.TryGetValue((tenantId, provider), out TenantItsmConnectorConnectionRecord? row);

        return Task.FromResult(row);
    }

    public Task<TenantItsmConnectorConnectionRecord?> UpsertAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        TenantItsmConnectorConnectionUpsertCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        TenantItsmConnectorConnectionRecord row = new()
        {
            TenantId = tenantId,
            Provider = provider,
            InstanceBaseUrl = command.InstanceBaseUrl,
            AuthMode = command.AuthMode,
            AuthUserName = command.AuthUserName,
            CredentialKeyVaultSecretName = command.CredentialKeyVaultSecretName,
            OAuthClientIdKeyVaultSecretName = command.OAuthClientIdKeyVaultSecretName,
            OAuthClientSecretKeyVaultSecretName = command.OAuthClientSecretKeyVaultSecretName,
            OAuthRefreshTokenKeyVaultSecretName = command.OAuthRefreshTokenKeyVaultSecretName,
            InboundWebhookKeyVaultSecretName = command.InboundWebhookKeyVaultSecretName,
            IsEnabled = command.IsEnabled,
            Label = command.Label,
            UpdatedUtc = TimeProvider.System.GetUtcNow()
        };

        _store[(tenantId, provider)] = row;

        return Task.FromResult<TenantItsmConnectorConnectionRecord?>(row);
    }

    public Task<bool> DeleteAsync(Guid tenantId, TenantItsmConnectorProvider provider, CancellationToken cancellationToken)
    {
        return Task.FromResult(_store.TryRemove((tenantId, provider), out _));
    }
}
