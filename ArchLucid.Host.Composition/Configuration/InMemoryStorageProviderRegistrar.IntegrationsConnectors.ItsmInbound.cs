using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Core.Persistence.ApplicationPorts.FineTuning;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.FineTuning;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

internal sealed partial class InMemoryStorageProviderRegistrar
{
    private static void RegisterIntegrationsConnectorsItsmInbound(IServiceCollection services)
    {
        services.AddSingleton<IItsmFindingCorrelationRepository, InMemoryItsmFindingCorrelationRepository>();
        services.AddSingleton<IRunFindingExternalTrackingReadRepository, InMemoryRunFindingExternalTrackingReadRepository>();
        services.AddSingleton<ITenantItsmOutboundSettingsRepository, InMemoryTenantItsmOutboundSettingsRepository>();
        services.AddSingleton<ITenantAzureBoardsOutboundSettingsRepository, InMemoryTenantAzureBoardsOutboundSettingsRepository>();
        services.AddSingleton<ITenantItsmConnectorConnectionRepository, InMemoryTenantItsmConnectorConnectionRepository>();
        services.AddSingleton<ITenantSettingsRepository, InMemoryTenantSettingsRepository>();
        services.AddSingleton<IFineTuningManifestConsentReader, TenantSettingsFineTuningManifestConsentReader>();
        services.AddSingleton<IFineTuningTrainingExportAuditRepository, InMemoryFineTuningTrainingExportAuditRepository>();
        services.AddScoped<ItsmInboundDispositionSync>();
        services.AddScoped<ItsmInboundWebhookSyncSupport>();
        services.AddSingleton<ItsmInboundJiraPayloadReader>();
        services.AddSingleton<ItsmInboundServiceNowPayloadReader>();
        services.AddSingleton<ItsmInboundJiraStatusMapper>();
        services.AddSingleton<ItsmInboundServiceNowStatusMapper>();
        services.AddScoped<ItsmInboundWebhookProcessPipeline>();
        services.AddScoped<ItsmInboundJiraWebhookProcessor>();
        services.AddScoped<ItsmInboundServiceNowWebhookProcessor>();
        services.AddScoped<ItsmInboundWebhookSyncService>();
        services.AddScoped<IItsmInboundWebhookFacade, ItsmInboundWebhookFacade>();
    }
}
