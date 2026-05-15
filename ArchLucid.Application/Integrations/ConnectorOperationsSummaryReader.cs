using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Decisioning.Alerts.Delivery;
using ArchLucid.Persistence.Advisory;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Persistence.Integrations;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations;

/// <summary>Builds connector operations rows from existing options and tenant repositories (no outbound calls).</summary>
public sealed class ConnectorOperationsSummaryReader(
    IOptions<IntegrationEventsOptions> integrationEventsOptions,
    IOptions<IntegrationsItsmOutboundOptions>? itsmOutboundOptions,
    IOptions<ConfluencePublishingOptions> confluenceOptions,
    ITenantTeamsIncomingWebhookConnectionRepository teamsConnectionRepository,
    ITenantItsmOutboundSettingsRepository tenantItsmSettingsRepository,
    IDigestSubscriptionRepository digestSubscriptionRepository,
    IAdvisoryScanScheduleRepository advisoryScheduleRepository,
    IAlertRoutingSubscriptionRepository alertRoutingRepository) : IConnectorOperationsSummaryReader
{
    private readonly IntegrationEventsOptions _bus = integrationEventsOptions.Value ??
                                                     throw new ArgumentNullException(nameof(integrationEventsOptions));

    private readonly IntegrationsItsmOutboundOptions _itsm = itsmOutboundOptions?.Value ??
                                                             throw new ArgumentNullException(nameof(itsmOutboundOptions));

    private readonly ConfluencePublishingOptions _confluence = confluenceOptions.Value ??
                                                               throw new ArgumentNullException(nameof(confluenceOptions));

    private readonly ITenantTeamsIncomingWebhookConnectionRepository _teamsConnectionRepository =
        teamsConnectionRepository ?? throw new ArgumentNullException(nameof(teamsConnectionRepository));

    private readonly ITenantItsmOutboundSettingsRepository _tenantItsmSettingsRepository =
        tenantItsmSettingsRepository ?? throw new ArgumentNullException(nameof(tenantItsmSettingsRepository));

    private readonly IDigestSubscriptionRepository _digestSubscriptionRepository =
        digestSubscriptionRepository ?? throw new ArgumentNullException(nameof(digestSubscriptionRepository));

    private readonly IAdvisoryScanScheduleRepository _advisoryScheduleRepository =
        advisoryScheduleRepository ?? throw new ArgumentNullException(nameof(advisoryScheduleRepository));

    private readonly IAlertRoutingSubscriptionRepository _alertRoutingRepository =
        alertRoutingRepository ?? throw new ArgumentNullException(nameof(alertRoutingRepository));

    /// <inheritdoc />
    public async Task<ConnectorOperationsSummary> GetSummaryAsync(ScopeContext scope, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        IReadOnlyList<DigestSubscription> digests =
            await _digestSubscriptionRepository.ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                cancellationToken).ConfigureAwait(false);

        IReadOnlyList<AdvisoryScanSchedule> schedules =
            await _advisoryScheduleRepository.ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                cancellationToken).ConfigureAwait(false);

        IReadOnlyList<AlertRoutingSubscription> alertRoutes =
            await _alertRoutingRepository.ListEnabledByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                cancellationToken).ConfigureAwait(false);

        TenantItsmOutboundSettings? tenantItsm =
            await _tenantItsmSettingsRepository.TryGetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        TeamsIncomingWebhookConnectionResponse? teamsRow =
            await _teamsConnectionRepository.GetAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        bool teamsConfigured = teamsRow is { IsConfigured: true };
        string teamsSmoke = teamsConfigured ? "LocallyValid" : "NotConfigured";

        ItsmOutboundLocalReadiness jiraLocal = ItsmOutboundLocalConfigurationEvaluator.EvaluateJira(_itsm, tenantItsm);
        ItsmOutboundLocalReadiness snowLocal = ItsmOutboundLocalConfigurationEvaluator.EvaluateServiceNow(_itsm);
        bool jiraOk = jiraLocal.IsReady;
        string jiraSummary = jiraLocal.Summary;
        bool snowOk = snowLocal.IsReady;
        string snowSummary = snowLocal.Summary;
        (bool confOk, string confSummary) = EvaluateConfluence();

        int slackRoutes = alertRoutes.Count(static r =>
            string.Equals(r.ChannelType, AlertRoutingChannelType.SlackWebhook, StringComparison.OrdinalIgnoreCase));

        bool slackConfigured = slackRoutes > 0;
        string slackSmoke = slackConfigured ? "RouteConfigured" : "NotConfigured";

        IntegrationEventBusSummary busSummary = BuildBusSummary();

        List<ConnectorSurfaceSummary> surfaces =
        [
            new()
            {
                ConnectorKey = "teams",
                DisplayName = "Microsoft Teams (incoming webhook)",
                IsConfigured = teamsConfigured,
                SmokeReadiness = teamsSmoke,
                Summary = teamsConfigured
                    ? "Key Vault secret name is configured for tenant-level Teams notifications."
                    : "No Teams incoming webhook connection row for this tenant.",
                ConfigurationHref = "/integrations/teams",
            },
            new()
            {
                ConnectorKey = "slack",
                DisplayName = "Slack (alert routing)",
                IsConfigured = slackConfigured,
                SmokeReadiness = slackSmoke,
                Summary = slackConfigured
                    ? $"{slackRoutes} enabled alert routing subscription(s) use Slack webhooks."
                    : "No enabled Slack webhook routes in this workspace scope.",
                ConfigurationHref = "/alerts",
            },
            new()
            {
                ConnectorKey = "jira",
                DisplayName = "Jira (ITSM outbound)",
                IsConfigured = jiraOk,
                SmokeReadiness = jiraOk ? "LocallyValid" : "ConfigurationIncomplete",
                Summary = jiraSummary,
                ConfigurationHref = "/integrations",
            },
            new()
            {
                ConnectorKey = "servicenow",
                DisplayName = "ServiceNow (ITSM outbound)",
                IsConfigured = snowOk,
                SmokeReadiness = snowOk ? "LocallyValid" : "ConfigurationIncomplete",
                Summary = snowSummary,
                ConfigurationHref = "/integrations",
            },
            new()
            {
                ConnectorKey = "confluence",
                DisplayName = "Confluence publish",
                IsConfigured = confOk,
                SmokeReadiness = confOk ? "LocallyValid" : "ConfigurationIncomplete",
                Summary = confSummary,
                ConfigurationHref = "/integrations",
            },
            BuildDigestAdvisorySurface(digests, schedules),
        ];

        return new ConnectorOperationsSummary { Surfaces = surfaces, IntegrationEventBus = busSummary };
    }

    private ConnectorSurfaceSummary BuildDigestAdvisorySurface(
        IReadOnlyList<DigestSubscription> digests,
        IReadOnlyList<AdvisoryScanSchedule> schedules)
    {
        int enabledSubs = digests.Count(static s => s.IsEnabled);
        int enabledSchedules = schedules.Count(static s => s.IsEnabled);
        bool configured = enabledSubs > 0 && enabledSchedules > 0;
        string smoke = configured ? "LocallyValid" : "ConfigurationIncomplete";

        string summary =
            $"{enabledSchedules} enabled advisory schedule(s); {enabledSubs} digest subscription row(s) in scope.";

        return new ConnectorSurfaceSummary
        {
            ConnectorKey = "digests_advisory",
            DisplayName = "Architecture digests & advisory schedules",
            IsConfigured = configured,
            SmokeReadiness = smoke,
            Summary = summary,
            ConfigurationHref = "/digests",
        };
    }

    private IntegrationEventBusSummary BuildBusSummary()
    {
        bool hasQueue = !string.IsNullOrWhiteSpace(_bus.QueueOrTopicName);
        bool hasLegacyConnection = !string.IsNullOrWhiteSpace(_bus.ServiceBusConnectionString);
        bool hasNamespace = !string.IsNullOrWhiteSpace(_bus.ServiceBusFullyQualifiedNamespace);
        bool publisher = hasQueue && (hasLegacyConnection || hasNamespace);
        bool consumer = _bus.ConsumerEnabled && hasQueue && !string.IsNullOrWhiteSpace(_bus.SubscriptionName);

        string smoke = publisher ? "LocallyValid" : "NotConfigured";
        if (publisher && _bus.ConsumerEnabled && !consumer)
            smoke = "ConfigurationIncomplete";

        return new IntegrationEventBusSummary
        {
            PublisherConfigured = publisher,
            TransactionalOutboxEnabled = _bus.TransactionalOutboxEnabled,
            ConsumerConfigured = consumer,
            QueueOrTopicName = string.IsNullOrWhiteSpace(_bus.QueueOrTopicName) ? null : _bus.QueueOrTopicName.Trim(),
            FullyQualifiedNamespace =
                string.IsNullOrWhiteSpace(_bus.ServiceBusFullyQualifiedNamespace)
                    ? null
                    : _bus.ServiceBusFullyQualifiedNamespace.Trim(),
            UsesLegacyConnectionString = hasLegacyConnection,
            SmokeReadiness = smoke,
        };
    }

    private (bool Ok, string Summary) EvaluateConfluence()
    {
        if (!_confluence.Enabled)
            return (false, "Confluence publishing is disabled in Integrations:ConfluencePublishing:Enabled.");

        string url = _confluence.CloudBaseUrl.Trim();
        bool urlOk = ItsmOutboundLocalConfigurationEvaluator.TryValidateHttpsUrl(url);
        bool spaceOk = !string.IsNullOrWhiteSpace(_confluence.SpaceKey.Trim()) ||
                       (_confluence.ProjectSpaceKeys is not null &&
                        _confluence.ProjectSpaceKeys.Keys.Any(k => !string.IsNullOrWhiteSpace(k)) &&
                        _confluence.ProjectSpaceKeys.Values.Any(v => !string.IsNullOrWhiteSpace(v)));
        bool tokenOk = !string.IsNullOrWhiteSpace(_confluence.ApiToken.Trim());
        bool emailOk = !string.IsNullOrWhiteSpace(_confluence.ServiceAccountEmail.Trim());

        if (!urlOk)
            return (false, "Set Integrations:ConfluencePublishing:CloudBaseUrl to a valid https:// Atlassian URL.");

        if (!spaceOk)
            return (false, "Set Integrations:ConfluencePublishing:SpaceKey (default) or ProjectSpaceKeys for per-project routing.");

        if (!emailOk || !tokenOk)
            return (false, "Confluence requires service account email and API token fields.");

        return (true, "Confluence Cloud URL, space, and credential fields are populated (live REST validation still required).");
    }
}
