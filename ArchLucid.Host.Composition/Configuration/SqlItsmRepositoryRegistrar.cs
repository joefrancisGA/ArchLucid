using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.FineTuning;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Persistence.FineTuning;
using ArchLucid.Persistence.Integrations;

namespace ArchLucid.Host.Composition.Configuration;

/// <summary>
///     SQL registrations for ITSM/integration outbound repositories and inbound sync services.
/// </summary>
internal static class SqlItsmRepositoryRegistrar
{
    public static void Register(IServiceCollection services)
    {
        services.AddScoped<IItsmFindingCorrelationRepository, SqlItsmFindingCorrelationRepository>();
        services.AddScoped<ITenantItsmOutboundSettingsRepository, SqlTenantItsmOutboundSettingsRepository>();
        services.AddScoped<ITenantAzureBoardsOutboundSettingsRepository, SqlTenantAzureBoardsOutboundSettingsRepository>();
        services.AddScoped<ITenantItsmConnectorConnectionRepository, SqlTenantItsmConnectorConnectionRepository>();
        services.AddScoped<IFineTuningManifestConsentReader, TenantSettingsFineTuningManifestConsentReader>();
        services.AddScoped<IFineTuningTrainingExportAuditRepository, SqlFineTuningTrainingExportAuditRepository>();
        services.AddScoped<ItsmInboundDispositionSync>();
        services.AddScoped<ItsmInboundWebhookSyncSupport>();
        services.AddScoped<ItsmInboundJiraWebhookProcessor>();
        services.AddScoped<ItsmInboundServiceNowWebhookProcessor>();
        services.AddScoped<ItsmInboundWebhookSyncService>();
    }
}
