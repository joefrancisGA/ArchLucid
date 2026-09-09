using System.Text.Json;

using ArchLucid.Core.AdminNotifications;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>One SCIM bearer-token rotation reminder scan cycle.</summary>
public static class ScimTokenRotationReminderIteration
{
    public static async Task RunOnceAsync(
        IServiceScopeFactory scopeFactory,
        ScimOptions opts,
        ILogger logger,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scopeFactory);
        ArgumentNullException.ThrowIfNull(opts);
        ArgumentNullException.ThrowIfNull(logger);

        int reminderDays = opts.TokenRotationReminderDays;

        if (reminderDays <= 0)
            return;

        DateTimeOffset cutoffUtc = TimeProvider.System.GetUtcNow().AddDays(-reminderDays);
        using IServiceScope scope = scopeFactory.CreateScope();
        IScimTenantTokenRepository tokens = scope.ServiceProvider.GetRequiredService<IScimTenantTokenRepository>();
        IAdminNotificationsRepository notices = scope.ServiceProvider.GetRequiredService<IAdminNotificationsRepository>();
        IReadOnlyList<ScimTokenRotationCandidate> due =
            await tokens.ListActiveCreatedOnOrBeforeAsync(cutoffUtc, ct).ConfigureAwait(false);

        foreach (ScimTokenRotationCandidate row in due)
        {
            if (logger.IsEnabled(LogLevel.Warning))
            {
                logger.LogWarning(
                    "archlucid.scim.token.rotation_due tenantId={TenantId} tokenId={TokenId} createdUtc={CreatedUtc:o}",
                    row.TenantId,
                    row.Id,
                    row.CreatedUtc);
            }

            string dataJson = JsonSerializer.Serialize(new { tenantId = row.TenantId, tokenId = row.Id, createdUtc = row.CreatedUtc });

            await notices.InsertAsync(
                "scim_token_rotation_due",
                $"SCIM bearer token {row.Id:D} for tenant {row.TenantId:D} is older than the configured rotation reminder ({reminderDays} days). Rotate or revoke in admin.",
                dataJson,
                ct).ConfigureAwait(false);
        }
    }
}
