using System.Text.Json;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Services.Admin;

public interface IIdentityProviderActivationService
{
    Task<TenantIdentityProviderConfigurationRecord> ActivateAsync(
        Guid tenantId,
        string actorId,
        IdentityProviderActivateRequest request,
        CancellationToken cancellationToken);
}

/// <inheritdoc cref="IIdentityProviderActivationService" />
public sealed class IdentityProviderActivationService(
    ITenantIdentityProviderConfigurationRepository repository) : IIdentityProviderActivationService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = false };

    private readonly ITenantIdentityProviderConfigurationRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    /// <inheritdoc />
    public async Task<TenantIdentityProviderConfigurationRecord> ActivateAsync(
        Guid tenantId,
        string actorId,
        IdentityProviderActivateRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);

        string protocol = request.Protocol?.Trim().ToLowerInvariant() ?? string.Empty;

        TenantIdentityProtocol parsedProtocol = protocol switch
        {
            "oidc" => TenantIdentityProtocol.Oidc,
            "saml" => TenantIdentityProtocol.Saml,
            _ => throw new ArgumentException("Protocol must be oidc or saml.")
        };

        if (string.IsNullOrWhiteSpace(request.IssuerUri))
            throw new ArgumentException("IssuerUri is required.");

        IdentityClaimRoleMappingDocument mapping = IdentityClaimRoleMappingResolver.ToDocument(request.ClaimMapping);
        IdentityClaimRoleMappingResolver.ValidateMapping(mapping);

        string claimMappingJson = JsonSerializer.Serialize(mapping, JsonOptions);

        TenantIdentityProviderConfigurationRecord? existing =
            await _repository.TryGetAsync(tenantId, cancellationToken).ConfigureAwait(false);

        TenantIdentityProviderConfigurationRecord record = new()
        {
            TenantId = tenantId,
            Protocol = parsedProtocol,
            IssuerUri = request.IssuerUri.Trim(),
            MetadataXml = ResolveOptionalPersistedField(request.MetadataXml, existing?.MetadataXml),
            ClaimMappingJson = claimMappingJson,
            KeyVaultSecretName = ResolveOptionalPersistedField(request.KeyVaultSecretName, existing?.KeyVaultSecretName),
            UpdatedUtc = TimeProvider.System.GetUtcNow(),
            UpdatedByActorId = actorId.Trim(),
            IsActive = true
        };

        await _repository.UpsertAsync(record, cancellationToken).ConfigureAwait(false);

        return record;
    }

    /// <summary>
    ///     Null request field preserves an existing stored value; whitespace-only clears; otherwise trims and stores.
    /// </summary>
    private static string? ResolveOptionalPersistedField(string? requestValue, string? existingValue)
    {
        if (requestValue is null)
            return existingValue;

        if (string.IsNullOrWhiteSpace(requestValue))
            return null;

        return requestValue.Trim();
    }
}
