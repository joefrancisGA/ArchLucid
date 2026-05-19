using ArchLucid.Api.Authentication;
using ArchLucid.Core.Authentication;
using ArchLucid.Core.Configuration.Summary;

using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Services.Admin;

public sealed class AdminApiKeySettingsService(IOptionsMonitor<ApiKeyAuthenticationOptions> optionsMonitor)
    : IAdminApiKeySettingsService
{
    private readonly IOptionsMonitor<ApiKeyAuthenticationOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    public AdminApiKeySettingsResponse GetSnapshot()
    {
        ApiKeyAuthenticationOptions options = _optionsMonitor.CurrentValue;

        return new AdminApiKeySettingsResponse
        {
            Enabled = options.Enabled,
            DevelopmentBypassAll = options.DevelopmentBypassAll,
            Admin = BuildSlot(options.AdminKey, options.AdminKeyExpiresAt),
            ReadOnly = BuildSlot(options.ReadOnlyKey, options.ReadOnlyKeyExpiresAt)
        };
    }

    public AdminApiKeyRotateResponse Rotate(AdminApiKeyRotateRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        AdminApiKeySlot slot = ParseSlot(request.Slot);
        ApiKeyAuthenticationOptions options = _optionsMonitor.CurrentValue;
        string plaintextKey = ApiKeyMaterialGenerator.GenerateHexKey();
        string configPath = slot == AdminApiKeySlot.Admin
            ? $"{ApiKeyAuthenticationOptions.SectionPath}:AdminKey"
            : $"{ApiKeyAuthenticationOptions.SectionPath}:ReadOnlyKey";

        if (request.InvalidatePrevious)
        {
            return new AdminApiKeyRotateResponse
            {
                Slot = slot.ToString(),
                ConfigPath = configPath,
                PlaintextKey = plaintextKey,
                DeploymentAction = "Replace",
                ReplaceConfigValue = plaintextKey
            };
        }

        string? current = slot == AdminApiKeySlot.Admin ? options.AdminKey : options.ReadOnlyKey;

        if (string.IsNullOrWhiteSpace(current))
        {
            return new AdminApiKeyRotateResponse
            {
                Slot = slot.ToString(),
                ConfigPath = configPath,
                PlaintextKey = plaintextKey,
                DeploymentAction = "Replace",
                ReplaceConfigValue = plaintextKey
            };
        }

        return new AdminApiKeyRotateResponse
        {
            Slot = slot.ToString(),
            ConfigPath = configPath,
            PlaintextKey = plaintextKey,
            DeploymentAction = "Append",
            AppendConfigSuffix = $",{plaintextKey}"
        };
    }

    private static ApiKeySlotStatusDto BuildSlot(string? raw, DateTimeOffset? expiresAtUtc)
    {
        IReadOnlyList<string> masked = ApiKeyMaterialMasker.MaskCommaSeparatedSegments(raw);

        return new ApiKeySlotStatusDto
        {
            IsConfigured = masked.Count > 0,
            MaskedSegments = masked,
            ExpiresAtUtc = expiresAtUtc
        };
    }

    private static AdminApiKeySlot ParseSlot(string? raw)
    {
        if (string.Equals(raw, "ReadOnly", StringComparison.OrdinalIgnoreCase))
            return AdminApiKeySlot.ReadOnly;

        if (string.Equals(raw, "Admin", StringComparison.OrdinalIgnoreCase))
            return AdminApiKeySlot.Admin;

        throw new ArgumentException("Slot must be Admin or ReadOnly.", nameof(raw));
    }
}
