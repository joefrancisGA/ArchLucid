using ArchLucid.Contracts.Admin;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.IntegrationSecrets;

namespace ArchLucid.Application.AiProviders;

public interface ITenantAzureOpenAiConnectionService
{
    Task<TenantAzureOpenAiConnectionResponse> GetAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<TenantAzureOpenAiConnectionResponse?> UpsertAsync(
        Guid tenantId,
        TenantAzureOpenAiConnectionUpsertRequest request,
        CancellationToken cancellationToken);

    Task<bool> DeleteAsync(Guid tenantId, CancellationToken cancellationToken);
}

public sealed class TenantAzureOpenAiConnectionService(
    ITenantAzureOpenAiConnectionRepository repository,
    IIntegrationSecretWriter secretWriter) : ITenantAzureOpenAiConnectionService
{
    private readonly ITenantAzureOpenAiConnectionRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly IIntegrationSecretWriter _secretWriter =
        secretWriter ?? throw new ArgumentNullException(nameof(secretWriter));

    public async Task<TenantAzureOpenAiConnectionResponse> GetAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        TenantAzureOpenAiConnectionRecord? row =
            await _repository.GetAsync(tenantId, cancellationToken).ConfigureAwait(false);

        return row is null
            ? TenantAzureOpenAiConnectionMapper.Empty(tenantId)
            : TenantAzureOpenAiConnectionMapper.ToResponse(row);
    }

    public async Task<TenantAzureOpenAiConnectionResponse?> UpsertAsync(
        Guid tenantId,
        TenantAzureOpenAiConnectionUpsertRequest request,
        CancellationToken cancellationToken)
    {
        if (!TenantAzureOpenAiConnectionUpsertValidation.TryBuildCommand(request, out TenantAzureOpenAiConnectionUpsertCommand? command, out _))
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(request.ApiKey))
        {
            bool stored = await _secretWriter.TryUpsertSecretAsync(
                command!.ApiKeyKeyVaultSecretName,
                request.ApiKey.Trim(),
                cancellationToken).ConfigureAwait(false);

            if (!stored)
            {
                return null;
            }
        }

        TenantAzureOpenAiConnectionRecord? saved =
            await _repository.UpsertAsync(tenantId, command!, cancellationToken).ConfigureAwait(false);

        return saved is null ? null : TenantAzureOpenAiConnectionMapper.ToResponse(saved);
    }

    public Task<bool> DeleteAsync(Guid tenantId, CancellationToken cancellationToken) =>
        _repository.DeleteAsync(tenantId, cancellationToken);
}
