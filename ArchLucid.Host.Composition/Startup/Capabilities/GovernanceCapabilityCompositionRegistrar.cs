using ArchLucid.Application.Evidence;
using ArchLucid.Application.Findings;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Core.Hosting;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup;

/// <summary>Governance capability composition facade (workflow, decisioning, findings re-review).</summary>
public static partial class ServiceCollectionExtensions
{
    /// <summary>Registers governance capability services (workflow, decisioning, findings re-review).</summary>
    public static IServiceCollection AddGovernanceCapability(
        this IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services.AddSingleton<IReasoningSummaryBuilder, ReasoningSummaryBuilder>();
        RegisterDecisioningEngines(services, configuration);
        RegisterGovernance(services, configuration);
        ComplianceDriftEscalationCompositionModule.Register(services, configuration, hostingRole);
        RegisterWaiverExpiryNotificationHostedService(services, hostingRole);
        services.Configure<FindingVerificationOptions>(
            configuration.GetSection(FindingVerificationOptions.SectionName));
        services.AddSingleton<IEvidenceAddedIncrementalReReviewQueue, EvidenceAddedIncrementalReReviewQueue>();
        services.AddScoped<IEvidenceAddedIncrementalReReviewCoordinator, EvidenceAddedIncrementalReReviewCoordinator>();
        services.AddHostedService<EvidenceAddedIncrementalReReviewHostedService>();
        services.Configure<IncrementalReReviewOnEvidenceAddedOptions>(
            configuration.GetSection(IncrementalReReviewOnEvidenceAddedOptions.SectionName));

        return services;
    }
}
