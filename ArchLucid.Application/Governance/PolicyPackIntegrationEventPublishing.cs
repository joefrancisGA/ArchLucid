using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Persistence.IntegrationOutbox;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Governance;

/// <summary>Publishes policy pack lifecycle integration events after governance mutations.</summary>
public static class PolicyPackIntegrationEventPublishing
{
    public static Task TryPublishPublishedAsync(
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IIntegrationEventPublisher integrationEventPublisher,
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
        ILogger logger,
        PolicyPack pack,
        PolicyPackVersion packVersion,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(integrationEventOutbox);
        ArgumentNullException.ThrowIfNull(integrationEventPublisher);
        ArgumentNullException.ThrowIfNull(integrationEventsOptions);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(pack);
        ArgumentNullException.ThrowIfNull(packVersion);

        object payload = new
        {
            schemaVersion = 1,
            tenantId = pack.TenantId,
            workspaceId = pack.WorkspaceId,
            projectId = pack.ProjectId,
            policyPackId = pack.PolicyPackId,
            policyPackVersionId = packVersion.PolicyPackVersionId,
            name = pack.Name,
            packType = pack.PackType,
            version = packVersion.Version,
            publishedUtc = packVersion.CreatedUtc,
        };

        string messageId =
            $"{pack.PolicyPackId:D}:{packVersion.PolicyPackVersionId:D}:{IntegrationEventTypes.GovernancePolicyPackPublishedV1}";

        return OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            integrationEventOutbox,
            integrationEventPublisher,
            integrationEventsOptions.CurrentValue,
            logger,
            IntegrationEventTypes.GovernancePolicyPackPublishedV1,
            payload,
            messageId,
            null,
            pack.TenantId,
            pack.WorkspaceId,
            pack.ProjectId,
            connection: null,
            transaction: null,
            cancellationToken);
    }
}
