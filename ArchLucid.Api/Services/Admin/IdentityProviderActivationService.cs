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
    // The SSO wizard reads this stored string as camelCase. The API envelope camelCases the record,
    // but ClaimMappingJson is raw JSON and would otherwise keep PascalCase property names.
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

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

        if (request.ClaimMapping is null)
            throw new ArgumentException("ClaimMapping is required.", nameof(request));

        if (request.ClaimMapping.Mappings is null)
            throw new ArgumentException("ClaimMapping.Mappings is required.", nameof(request));

        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (actorId is null)
            throw new ArgumentException("actorId is required.", nameof(actorId));

        string trimmedActorId = actorId.Trim();

        if (!IdentityProviderSubstantiveTextValidation.HasSubstantiveText(trimmedActorId))
            throw new ArgumentException("actorId is required.", nameof(actorId));

        IdentityProviderPersistedFieldLimits.EnsureUpdatedByActorIdFits(trimmedActorId);

        if (!IdentityProviderProtocolParser.TryParse(request.Protocol, out TenantIdentityProtocol parsedProtocol))
            throw new ArgumentException("Protocol must be oidc or saml.");

        if (!IdentityProviderUriValidator.TryGetCanonicalAbsoluteHttpOrHttps(request.IssuerUri, out string canonicalIssuerUri))
            throw new ArgumentException("IssuerUri must be an absolute HTTP(S) URL.");

        IdentityProviderPersistedFieldLimits.EnsureIssuerUriFits(canonicalIssuerUri);

        IdentityProviderClaimMappingSubstantiveGuards.EnsureNoNullMappingEntries(request.ClaimMapping);
        IdentityProviderClaimMappingSubstantiveGuards.EnsureSubstantiveMappingEntries(request.ClaimMapping);
        IdentityProviderClaimMappingSubstantiveGuards.EnsureSubstantiveCustomGroupClaimRegexWhenProvided(request.ClaimMapping);

        IdentityClaimRoleMappingDocument mapping = IdentityClaimRoleMappingResolver.ToDocument(request.ClaimMapping);
        IdentityProviderClaimMappingSubstantiveGuards.EnsureSubstantiveClaimMapping(mapping);
        IdentityClaimRoleMappingResolver.ValidateMapping(mapping);

        string claimMappingJson = JsonSerializer.Serialize(mapping, JsonOptions);

        TenantIdentityProviderConfigurationRecord? existing =
            await _repository.TryGetAsync(tenantId, cancellationToken).ConfigureAwait(false);

        bool sameProtocol = existing?.Protocol == parsedProtocol;

        TenantIdentityProviderConfigurationRecord record = new()
        {
            TenantId = tenantId,
            Protocol = parsedProtocol,
            IssuerUri = canonicalIssuerUri,
            MetadataXml = ResolveOptionalPersistedField(
                request.MetadataXml,
                sameProtocol ? existing?.MetadataXml : null),
            ClaimMappingJson = claimMappingJson,
            KeyVaultSecretName = ResolveKeyVaultSecretName(
                request.KeyVaultSecretName,
                sameProtocol ? existing?.KeyVaultSecretName : null),
            UpdatedUtc = TimeProvider.System.GetUtcNow(),
            UpdatedByActorId = trimmedActorId,
            IsActive = true
        };

        await _repository.UpsertAsync(record, cancellationToken).ConfigureAwait(false);

        return record;
    }

    /// <summary>
    ///     Resolves the secret name, then rejects a value the NVARCHAR(256) column cannot store.
    /// </summary>
    private static string? ResolveKeyVaultSecretName(string? requestValue, string? existingValue)
    {
        string? resolved = ResolveOptionalPersistedField(requestValue, existingValue);

        IdentityProviderPersistedFieldLimits.EnsureKeyVaultSecretNameFits(resolved);

        return resolved;
    }

    /// <summary>
    ///     Null request field preserves an existing stored value; whitespace-only clears; otherwise trims and stores.
    /// </summary>
    private static string? ResolveOptionalPersistedField(string? requestValue, string? existingValue)
    {
        if (requestValue is null)
            return existingValue;

        string trimmed = requestValue.Trim();

        if (!IdentityProviderSubstantiveTextValidation.HasSubstantiveText(trimmed))
            return null;

        return trimmed;
    }
}
