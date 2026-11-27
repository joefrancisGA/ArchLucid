using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Security;

internal static class RuntimeTelemetryRegistration
{
    internal static IServiceCollection AddProvisionedRuntimeTelemetry(this IServiceCollection services)
    {
        services.AddScoped<IRuntimeTelemetryReadAuthority, ProvisionedRuntimeTelemetryAuthority>();
        services.AddScoped<IRuntimeTelemetryEnvelopeStore, ProvisionedRuntimeTelemetryEnvelopeStore>();
        services.AddScoped<IRuntimeTelemetryTrustRegistry, ProvisionedRuntimeTelemetryTrustRegistry>();
        services.AddScoped<IScopedRuntimeTelemetryReader, ScopedRuntimeTelemetryReader>();
        services.AddScoped<IRuntimeAttestationReplayGuard>(provider =>
            new SqlRuntimeAttestationReplayGuard(provider.GetService<ArchLucid.Persistence.Connections.ISqlConnectionFactory>()));
        services.AddScoped<IAuthorizedRuntimeObservationSource, SignedRuntimeObservationSource>();
        services.AddScoped<RuntimeObservationAdapter>();
        services.AddScoped<RuntimeDeploymentAdvisoryEvaluator>();
        services.AddScoped<RuntimeDeploymentLifecycleEvaluator>();
        services.AddScoped<IVerifiedRuntimeAdvisoryCatalogSource, ProvisionedRuntimeAdvisoryCatalogSource>();
        services.AddScoped<RuntimeAdvisoryFindingService>();
        services.AddScoped<IVerifiedDependencyIdentityBindingSource, ProvisionedDependencyIdentityBindingSource>();
        services.AddScoped<DependencyIdentityEvidenceService>();
        services.AddScoped<IRuntimeFindingJournal>(provider => new SqlRuntimeFindingJournal(
            provider.GetService<ArchLucid.Persistence.Connections.ISqlConnectionFactory>(),
            provider.GetRequiredService<IConfiguration>(),
            provider.GetRequiredService<IRuntimeAttestationPublicationAuthority>()));
        services.AddScoped<RuntimeFindingPersistenceService>();
        services.AddScoped<SqlRuntimeFindingJournalReader>(provider => new SqlRuntimeFindingJournalReader(
            provider.GetService<ArchLucid.Persistence.Connections.ISqlConnectionFactory>(),
            provider.GetRequiredService<IRuntimeTelemetryReadAuthority>()));
        services.AddScoped<IRuntimeAttestationPublicationAuthority, ProvisionedRuntimePublicationAuthority>();
        services.AddScoped<IRuntimeAttestationPublicationStore, AtomicRuntimeAttestationPublicationStore>();
        services.AddHttpClient("SecureNowRuntimeKeyVault", client => client.Timeout = TimeSpan.FromSeconds(15))
            .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
            {
                AllowAutoRedirect = false,
                UseCookies = false,
            });
        services.AddScoped<IScopedRuntimeDigestSigner>(provider => new KeyVaultRuntimeDigestSigner(
            provider.GetRequiredService<IConfiguration>(),
            new Azure.Identity.ManagedIdentityCredential(Azure.Identity.ManagedIdentityId.SystemAssigned),
            provider.GetRequiredService<IHttpClientFactory>().CreateClient("SecureNowRuntimeKeyVault"),
            provider.GetRequiredService<IRuntimeAttestationPublicationAuthority>(),
            provider.GetRequiredService<IRuntimeTelemetryTrustRegistry>()));
        // No fabricated process evidence: hosts without a trusted collector return unavailable.
        Microsoft.Extensions.DependencyInjection.Extensions.ServiceCollectionDescriptorExtensions.TryAddScoped<
            IRuntimeProcessEvidenceCollector, SignedWorkloadProcessEvidenceCollector>(services);
        services.AddScoped<IAuthorizedRuntimeAttestationProducer, AuthorizedRuntimeAttestationProducer>();
        services.AddScoped<RuntimeAttestationPublisher>();
        services.AddScoped<RuntimeSecurityExecutionService>();
        services.AddHostedService<RuntimeSecurityScheduledWorker>();
        return services;
    }
}
