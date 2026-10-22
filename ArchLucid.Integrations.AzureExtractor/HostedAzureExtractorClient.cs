using System.Text.Json;

using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Configuration;

using Azure.Core;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureExtractorClient(
    IHostedAzureExtractorCredentialFactory credentialFactory,
    IHostedAzureArmReadClient armReadClient,
    IHostedAzureManagementPostReadClient postReadClient,
    IEntraGroupMembershipGraphReader entraGroupMembershipGraphReader,
    IOptionsMonitor<EntraGroupMembershipGraphOptions> entraGroupMembershipGraphOptions,
    IEntraAddCredentialGraphReader entraAddCredentialGraphReader,
    IOptionsMonitor<EntraAddCredentialGraphOptions> entraAddCredentialGraphOptions,
    ILogger<HostedAzureExtractorClient> logger) : IHostedAzureExtractorClient
{
    private const string ManagementScope = "https://management.azure.com/.default";

    private readonly IHostedAzureExtractorCredentialFactory _credentialFactory =
        credentialFactory ?? throw new ArgumentNullException(nameof(credentialFactory));

    private readonly IHostedAzureArmReadClient _armReadClient =
        armReadClient ?? throw new ArgumentNullException(nameof(armReadClient));

    private readonly IHostedAzureManagementPostReadClient _postReadClient =
        postReadClient ?? throw new ArgumentNullException(nameof(postReadClient));

    private readonly IEntraGroupMembershipGraphReader _entraGroupMembershipGraphReader =
        entraGroupMembershipGraphReader ?? throw new ArgumentNullException(nameof(entraGroupMembershipGraphReader));

    private readonly IOptionsMonitor<EntraGroupMembershipGraphOptions> _entraGroupMembershipGraphOptions =
        entraGroupMembershipGraphOptions ?? throw new ArgumentNullException(nameof(entraGroupMembershipGraphOptions));

    private readonly IEntraAddCredentialGraphReader _entraAddCredentialGraphReader =
        entraAddCredentialGraphReader ?? throw new ArgumentNullException(nameof(entraAddCredentialGraphReader));

    private readonly IOptionsMonitor<EntraAddCredentialGraphOptions> _entraAddCredentialGraphOptions =
        entraAddCredentialGraphOptions ?? throw new ArgumentNullException(nameof(entraAddCredentialGraphOptions));

    private readonly ILogger<HostedAzureExtractorClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<HostedAzureExtractorCollectionResult> CollectZipAsync(
        HostedAzureExtractorCollectionRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        HostedAzureExtractorGuidValidator.RequireCollectionRequestGuids(request);

        if (!string.IsNullOrWhiteSpace(request.ManagementGroupId))
        {
            return await CollectManagementGroupZipAsync(request, cancellationToken).ConfigureAwait(false);
        }

        return await CollectSubscriptionZipAsync(request, cancellationToken).ConfigureAwait(false);
    }

    private async Task<HostedAzureExtractorCollectionResult> CollectSubscriptionZipAsync(
        HostedAzureExtractorCollectionRequest request,
        CancellationToken cancellationToken)
    {
        TokenCredential credential = _credentialFactory.CreateCredential(
            request.CustomerTenantId,
            request.CustomerAppId);

        AccessToken accessToken = await credential
            .GetTokenAsync(new TokenRequestContext([ManagementScope]), cancellationToken)
            .ConfigureAwait(false);

        string subscriptionId = request.SubscriptionId!.Trim();

        IReadOnlyList<HostedAzureArmResourceRecord> indexResources = await _armReadClient
            .ListSubscriptionResourcesAsync(accessToken.Token, subscriptionId, cancellationToken)
            .ConfigureAwait(false);

        HostedAzureArmNetworkResourceEnrichResult enrichResult = await HostedAzureArmNetworkResourceEnricher
            .EnrichAsync(
                _armReadClient,
                accessToken.Token,
                subscriptionId,
                indexResources,
                _logger,
                cancellationToken)
            .ConfigureAwait(false);

        HostedAzureArmPaasResourceEnrichResult paasEnrichResult = await HostedAzureArmPaasResourceEnricher
            .EnrichAsync(
                _armReadClient,
                accessToken.Token,
                subscriptionId,
                enrichResult.Resources,
                _logger,
                cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<HostedAzureArmResourceRecord> resources = paasEnrichResult.Resources;

        HostedAzureAksWorkloadImageCollectResult aksWorkloadImageResult =
            await HostedAzureAksWorkloadImageCollector.CollectAsync(
                _postReadClient,
                accessToken.Token,
                resources,
                _logger,
                cancellationToken).ConfigureAwait(false);
        resources = HostedAzureArmResourceRecordMerger.MergeByResourceId(
            resources,
            aksWorkloadImageResult.EnrichedResources);

        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> standingRoleAssignments = await _armReadClient
            .ListSubscriptionRoleAssignmentsAsync(accessToken.Token, subscriptionId, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> eligibleRoleAssignments = await _armReadClient
            .ListSubscriptionRoleEligibilitySchedulesAsync(accessToken.Token, subscriptionId, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> roleAssignments =
            HostedAzureRoleAssignmentMerger.Merge(standingRoleAssignments, eligibleRoleAssignments);

        string? subscriptionName = await _armReadClient
            .TryGetSubscriptionDisplayNameAsync(accessToken.Token, subscriptionId, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<HostedAzureArmFederatedCredentialRecord> federatedCredentials = await _armReadClient
            .ListFederatedCredentialsAsync(accessToken.Token, resources, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<HostedAzureArmPolicyAssignmentRecord> policyAssignments = await _armReadClient
            .ListSubscriptionPolicyAssignmentsAsync(accessToken.Token, subscriptionId, cancellationToken)
            .ConfigureAwait(false);

        HostedAzureDiagnosticSettingsCollectResult diagnosticSettingsResult = await _armReadClient
            .ListDiagnosticSettingsAsync(accessToken.Token, resources, cancellationToken)
            .ConfigureAwait(false);
        IReadOnlyList<HostedAzureArmDiagnosticSettingRecord> diagnosticSettings = diagnosticSettingsResult.Settings;

        IReadOnlyList<HostedAzureArmDefenderSummaryRecord> defenderSummaries = await _armReadClient
            .ListSubscriptionDefenderSummariesAsync(accessToken.Token, subscriptionId, cancellationToken)
            .ConfigureAwait(false);

        List<HostedAzureArmNetworkAssociationRecord> networkAssociations =
            HostedAzureInventoryNetworkAssociationBuilder.Build(resources).ToList();

        networkAssociations.AddRange(HostedAzureInventoryNsgAllowRuleBuilder.Build(resources));

        HostedAzureInventoryAvdSessionHostAssociationCollectResult avdSessionHostAssociations =
            await CollectAvdSessionHostAssociationsAsync(
                resources,
                accessToken.Token,
                cancellationToken).ConfigureAwait(false);

        networkAssociations.AddRange(avdSessionHostAssociations.Associations);

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult staticSiteAndFabricAssociations =
            await HostedAzureInventoryStaticSiteAndFabricAssociationCollector.CollectAsync(
                _armReadClient,
                accessToken.Token,
                resources,
                _logger,
                cancellationToken).ConfigureAwait(false);

        networkAssociations.AddRange(staticSiteAndFabricAssociations.Associations);

        HostedAzureEffectiveNetworkControlCollectResult effectiveNetworkControls = await HostedAzureEffectiveNetworkControlCollector
            .CollectAsync(_armReadClient, accessToken.Token, resources, _logger, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<AzureInventoryAdfLinkedServiceRow> adfLinkedServices = await HostedAzureInventoryAdfLinkedServiceCollector
            .CollectAsync(_armReadClient, accessToken.Token, resources, _logger, cancellationToken)
            .ConfigureAwait(false);

        HostedAzureInventoryAdfPipelineMetadataCollectResult adfPipelineMetadata =
            await HostedAzureInventoryAdfPipelineMetadataCollector
                .CollectAsync(_armReadClient, accessToken.Token, resources, _logger, cancellationToken)
                .ConfigureAwait(false);

        HostedAzureInventoryAdfExtendedMetadataCollectResult adfExtendedMetadata =
            await HostedAzureInventoryAdfExtendedMetadataCollector
                .CollectAsync(_armReadClient, accessToken.Token, resources, _logger, cancellationToken)
                .ConfigureAwait(false);

        HostedAzureDiagramEnrichmentCollectResult diagramEnrichment = await CollectDiagramEnrichmentAsync(
            subscriptionId,
            resources,
            accessToken.Token,
            request.IncludeAppSettingsHosts,
            cancellationToken).ConfigureAwait(false);

        IReadOnlyList<AzureInventoryRecoveryServicesProtectedItemRow> recoveryServicesProtectedItems =
            await HostedAzureInventoryRecoveryServicesCollector
                .CollectAsync(_armReadClient, accessToken.Token, resources, _logger, cancellationToken)
                .ConfigureAwait(false);

        IReadOnlyList<HostedAzureArmResourceRecord> inventoryResources = resources;
        List<string> collectionWarnings = [];

        if (diagnosticSettingsResult.PartialCollection)
        {
            collectionWarnings.Add(AzureInventoryDiagnosticCompletenessWarningCodes.PartialCollection);
        }

        collectionWarnings.AddRange(avdSessionHostAssociations.CollectionWarnings);
        collectionWarnings.AddRange(staticSiteAndFabricAssociations.CollectionWarnings);
        collectionWarnings.AddRange(diagramEnrichment.CollectionWarnings);
        collectionWarnings.AddRange(aksWorkloadImageResult.CollectionWarnings);

        DateTimeOffset collectionTimestampUtc = TimeProvider.System.GetUtcNow();
        string collectionTimestampUtcText = collectionTimestampUtc.ToString("o");
        string scopeDescriptor = $"/subscriptions/{subscriptionId}";

        HostedAzureActualCostSummary? actualCostSummary = null;

        if (request.IncludeCost)
        {
            actualCostSummary = await _postReadClient
                .TryQueryActualCostSummaryAsync(accessToken.Token, subscriptionId, cancellationToken)
                .ConfigureAwait(false);

            if (actualCostSummary is null)
            {
                collectionWarnings.Add("actual-cost-not-collected-hosted");
            }
        }

        HostedAzurePolicyComplianceDocument policyComplianceDocument = await _postReadClient
            .QueryPolicyComplianceAsync(
                accessToken.Token,
                subscriptionId,
                scopeDescriptor,
                collectionTimestampUtcText,
                cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<JsonElement> policyDefinitionDocuments = await CollectPolicyDefinitionDocumentsAsync(
            accessToken.Token,
            subscriptionId,
            cancellationToken).ConfigureAwait(false);

        IReadOnlyList<JsonElement> policyAssignmentDocuments = await _armReadClient
            .ListSubscriptionPolicyAssignmentDocumentsAsync(accessToken.Token, subscriptionId, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<AzureInventoryEntraGroupMembershipRow> entraGroupMemberships =
            await TryReadEntraGroupMembershipsAsync(
                credential,
                roleAssignments,
                subscriptionId,
                cancellationToken).ConfigureAwait(false);

        EntraAddCredentialGraphReadResult addCredentialSnapshot = await TryReadEntraAddCredentialSnapshotAsync(
            credential,
            subscriptionId,
            cancellationToken).ConfigureAwait(false);

        HostedAzureDefenderCompanionCollectResult defenderCompanions =
            await CollectDefenderCompanionsOrEmptyAsync(accessToken.Token, subscriptionId, cancellationToken)
                .ConfigureAwait(false);
        collectionWarnings.AddRange(defenderCompanions.Warnings);
        collectionWarnings.AddRange(
            DefenderPlanCoverageWarnings.Create(defenderCompanions.Pricings, inventoryResources));
        HostedAzureDefenderFollowOnCollectResult defenderFollowOn =
            await CollectDefenderFollowOnOrEmptyAsync(
                accessToken.Token,
                subscriptionId,
                defenderCompanions.Pricings,
                defenderCompanions.Assessments.Select(static row => row.AssessmentKey).ToArray(),
                cancellationToken).ConfigureAwait(false);
        collectionWarnings.AddRange(defenderFollowOn.Warnings);

        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            subscriptionId,
            inventoryResources,
            request.IncludeCost,
            collectionTimestampUtc,
            subscriptionName,
            entraGroupMemberships,
            roleAssignments,
            networkAssociations,
            federatedCredentials,
            managementGroupId: null,
            policyAssignments,
            diagnosticSettings,
            defenderSummaries,
            effectiveNetworkControls.Rows,
            adfLinkedServices,
            adfPipelineMetadata.Datasets,
            adfPipelineMetadata.PipelineFlows,
            adfExtendedMetadata.Triggers,
            adfExtendedMetadata.IntegrationRuntimes,
            adfExtendedMetadata.Dataflows,
            diagramEnrichment.EventGridSubscriptions,
            diagramEnrichment.LogicAppConnections,
            diagramEnrichment.MessagingAssociations,
            diagramEnrichment.PaasChildAssociations,
            diagramEnrichment.ServiceConnectorLinks,
            appSettingHosts: diagramEnrichment.AppSettingHosts,
            recoveryServicesProtectedItems: recoveryServicesProtectedItems,
            applicationOwners: addCredentialSnapshot.ApplicationOwners,
            directoryRoleAssignments: addCredentialSnapshot.DirectoryRoleAssignments,
            entraApplicationRegistrations: addCredentialSnapshot.ApplicationRegistrations,
            graphAppRoleAssignments: addCredentialSnapshot.GraphAppRoleAssignments,
            collectionWarnings: collectionWarnings,
            actualCostSummary: actualCostSummary,
            policyComplianceDocument: policyComplianceDocument,
            policyDefinitionDocuments: policyDefinitionDocuments,
            policyAssignmentDocuments: policyAssignmentDocuments,
            defenderPricings: defenderCompanions.Pricings,
            defenderScoreControls: defenderCompanions.ScoreControls,
            defenderAssessments: defenderCompanions.Assessments,
            defenderAssessmentCounts: defenderCompanions.AssessmentCounts,
            defenderSecurityContacts: defenderCompanions.SecurityContacts,
            defenderGovernanceAssignments: defenderFollowOn.GovernanceAssignments,
            defenderComplianceStandards: defenderFollowOn.ComplianceStandards,
            defenderComplianceControls: defenderFollowOn.ComplianceControls,
            defenderAlerts: defenderFollowOn.Alerts,
            defenderAttackPaths: defenderFollowOn.AttackPaths,
            defenderVulnerabilityCounts: defenderFollowOn.VulnerabilityCounts,
            defenderVulnerabilityFindings: defenderFollowOn.VulnerabilityFindings);

        string fileName =
            $"archlucid-hosted-azure-{subscriptionId.ToLowerInvariant()}-{collectionTimestampUtc:yyyyMMddHHmmss}.zip";

        return new HostedAzureExtractorCollectionResult
        {
            ZipBytes = zipBytes,
            OriginalFileName = fileName,
            ResourceCount = CountPackagedResources(inventoryResources)
        };
    }

    private async Task<HostedAzureExtractorCollectionResult> CollectManagementGroupZipAsync(
        HostedAzureExtractorCollectionRequest request,
        CancellationToken cancellationToken)
    {
        TokenCredential credential = _credentialFactory.CreateCredential(
            request.CustomerTenantId,
            request.CustomerAppId);

        AccessToken accessToken = await credential
            .GetTokenAsync(new TokenRequestContext([ManagementScope]), cancellationToken)
            .ConfigureAwait(false);

        string managementGroupId = request.ManagementGroupId!.Trim();
        string accessTokenValue = accessToken.Token;

        IReadOnlyList<string> subscriptionIds = await _armReadClient
            .ListManagementGroupSubscriptionIdsAsync(accessTokenValue, managementGroupId, cancellationToken)
            .ConfigureAwait(false);

        List<HostedAzureArmResourceRecord> resources = [];
        List<HostedAzureArmRoleAssignmentRecord> standingRoleAssignments = [];
        List<HostedAzureArmRoleAssignmentRecord> eligibleRoleAssignments = [];
        List<HostedAzureArmPolicyAssignmentRecord> policyAssignments = [];
        List<HostedAzureArmDefenderSummaryRecord> defenderSummaries = [];
        List<HostedAzureArmDefenderPricingRecord> defenderPricings = [];
        List<HostedAzureArmDefenderScoreControlRecord> defenderScoreControls = [];
        List<HostedAzureArmDefenderAssessmentRecord> defenderAssessments = [];
        List<HostedAzureArmDefenderAssessmentCountRecord> defenderAssessmentCounts = [];
        List<HostedAzureArmDefenderSecurityContactRecord> defenderSecurityContacts = [];
        List<HostedAzureArmDefenderGovernanceRecord> defenderGovernanceAssignments = [];
        List<HostedAzureArmDefenderComplianceStandardRecord> defenderComplianceStandards = [];
        List<HostedAzureArmDefenderComplianceControlRecord> defenderComplianceControls = [];
        List<HostedAzureArmDefenderAlertRecord> defenderAlerts = [];
        List<HostedAzureArmDefenderAttackPathRecord> defenderAttackPaths = [];
        List<HostedAzureArmDefenderVulnerabilityCountRecord> defenderVulnerabilityCounts = [];
        List<HostedAzureArmDefenderVulnerabilityFindingRecord> defenderVulnerabilityFindings = [];
        List<string> defenderCompanionWarnings = [];

        standingRoleAssignments.AddRange(
            await _armReadClient
                .ListManagementGroupRoleAssignmentsAsync(accessTokenValue, managementGroupId, cancellationToken)
                .ConfigureAwait(false));

        eligibleRoleAssignments.AddRange(
            await _armReadClient
                .ListManagementGroupRoleEligibilitySchedulesAsync(accessTokenValue, managementGroupId, cancellationToken)
                .ConfigureAwait(false));

        policyAssignments.AddRange(
            await _armReadClient
                .ListManagementGroupPolicyAssignmentsAsync(accessTokenValue, managementGroupId, cancellationToken)
                .ConfigureAwait(false));

        foreach (string subscriptionId in subscriptionIds)
        {
            IReadOnlyList<HostedAzureArmResourceRecord> subscriptionIndexResources = await _armReadClient
                .ListSubscriptionResourcesAsync(accessTokenValue, subscriptionId, cancellationToken)
                .ConfigureAwait(false);

            HostedAzureArmNetworkResourceEnrichResult enrichResult = await HostedAzureArmNetworkResourceEnricher
                .EnrichAsync(
                    _armReadClient,
                    accessTokenValue,
                    subscriptionId,
                    subscriptionIndexResources,
                    _logger,
                    cancellationToken)
                .ConfigureAwait(false);

            HostedAzureArmPaasResourceEnrichResult paasEnrichResult = await HostedAzureArmPaasResourceEnricher
                .EnrichAsync(
                    _armReadClient,
                    accessTokenValue,
                    subscriptionId,
                    enrichResult.Resources,
                    _logger,
                    cancellationToken)
                .ConfigureAwait(false);

            resources.AddRange(paasEnrichResult.Resources);

            standingRoleAssignments.AddRange(
                await _armReadClient
                    .ListSubscriptionRoleAssignmentsAsync(accessTokenValue, subscriptionId, cancellationToken)
                    .ConfigureAwait(false));

            eligibleRoleAssignments.AddRange(
                await _armReadClient
                    .ListSubscriptionRoleEligibilitySchedulesAsync(accessTokenValue, subscriptionId, cancellationToken)
                    .ConfigureAwait(false));

            policyAssignments.AddRange(
                await _armReadClient
                    .ListSubscriptionPolicyAssignmentsAsync(accessTokenValue, subscriptionId, cancellationToken)
                    .ConfigureAwait(false));

            defenderSummaries.AddRange(
                await _armReadClient
                    .ListSubscriptionDefenderSummariesAsync(accessTokenValue, subscriptionId, cancellationToken)
                    .ConfigureAwait(false));

            HostedAzureDefenderCompanionCollectResult subscriptionCompanions =
                await CollectDefenderCompanionsOrEmptyAsync(accessTokenValue, subscriptionId, cancellationToken)
                    .ConfigureAwait(false);
            defenderPricings.AddRange(subscriptionCompanions.Pricings);
            defenderScoreControls.AddRange(subscriptionCompanions.ScoreControls);
            defenderAssessments.AddRange(subscriptionCompanions.Assessments);
            defenderAssessmentCounts.AddRange(subscriptionCompanions.AssessmentCounts);
            defenderSecurityContacts.AddRange(subscriptionCompanions.SecurityContacts);
            defenderCompanionWarnings.AddRange(subscriptionCompanions.Warnings);
            HostedAzureDefenderFollowOnCollectResult subscriptionFollowOn =
                await CollectDefenderFollowOnOrEmptyAsync(
                    accessTokenValue,
                    subscriptionId,
                    subscriptionCompanions.Pricings,
                    subscriptionCompanions.Assessments.Select(static row => row.AssessmentKey).ToArray(),
                    cancellationToken).ConfigureAwait(false);
            defenderGovernanceAssignments.AddRange(subscriptionFollowOn.GovernanceAssignments);
            defenderComplianceStandards.AddRange(subscriptionFollowOn.ComplianceStandards);
            defenderComplianceControls.AddRange(subscriptionFollowOn.ComplianceControls);
            defenderAlerts.AddRange(subscriptionFollowOn.Alerts);
            defenderAttackPaths.AddRange(subscriptionFollowOn.AttackPaths);
            defenderVulnerabilityCounts.AddRange(subscriptionFollowOn.VulnerabilityCounts);
            defenderVulnerabilityFindings.AddRange(subscriptionFollowOn.VulnerabilityFindings);
            defenderCompanionWarnings.AddRange(subscriptionFollowOn.Warnings);
        }

        defenderSummaries = defenderSummaries
            .GroupBy(static row => row.ResourceId, StringComparer.OrdinalIgnoreCase)
            .Select(static group => group.First())
            .ToList();

        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> roleAssignments =
            HostedAzureRoleAssignmentMerger.Merge(standingRoleAssignments, eligibleRoleAssignments);

        IReadOnlyList<HostedAzureArmFederatedCredentialRecord> federatedCredentials = await _armReadClient
            .ListFederatedCredentialsAsync(accessTokenValue, resources, cancellationToken)
            .ConfigureAwait(false);

        HostedAzureDiagnosticSettingsCollectResult diagnosticSettingsResult = await _armReadClient
            .ListDiagnosticSettingsAsync(accessTokenValue, resources, cancellationToken)
            .ConfigureAwait(false);
        IReadOnlyList<HostedAzureArmDiagnosticSettingRecord> diagnosticSettings = diagnosticSettingsResult.Settings;

        List<HostedAzureArmNetworkAssociationRecord> networkAssociations =
            HostedAzureInventoryNetworkAssociationBuilder.Build(resources).ToList();

        networkAssociations.AddRange(HostedAzureInventoryNsgAllowRuleBuilder.Build(resources));

        HostedAzureInventoryAvdSessionHostAssociationCollectResult avdSessionHostAssociations =
            await CollectAvdSessionHostAssociationsAsync(
                resources,
                accessTokenValue,
                cancellationToken).ConfigureAwait(false);

        networkAssociations.AddRange(avdSessionHostAssociations.Associations);

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult staticSiteAndFabricAssociations =
            await HostedAzureInventoryStaticSiteAndFabricAssociationCollector.CollectAsync(
                _armReadClient,
                accessTokenValue,
                resources,
                _logger,
                cancellationToken).ConfigureAwait(false);

        networkAssociations.AddRange(staticSiteAndFabricAssociations.Associations);

        HostedAzureEffectiveNetworkControlCollectResult effectiveNetworkControls = await HostedAzureEffectiveNetworkControlCollector
            .CollectAsync(_armReadClient, accessTokenValue, resources, _logger, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<AzureInventoryAdfLinkedServiceRow> adfLinkedServices = await HostedAzureInventoryAdfLinkedServiceCollector
            .CollectAsync(_armReadClient, accessTokenValue, resources, _logger, cancellationToken)
            .ConfigureAwait(false);

        HostedAzureInventoryAdfPipelineMetadataCollectResult adfPipelineMetadata =
            await HostedAzureInventoryAdfPipelineMetadataCollector
                .CollectAsync(_armReadClient, accessTokenValue, resources, _logger, cancellationToken)
                .ConfigureAwait(false);

        HostedAzureInventoryAdfExtendedMetadataCollectResult adfExtendedMetadata =
            await HostedAzureInventoryAdfExtendedMetadataCollector
                .CollectAsync(_armReadClient, accessTokenValue, resources, _logger, cancellationToken)
                .ConfigureAwait(false);

        HostedAzureDiagramEnrichmentCollectResult diagramEnrichment = await CollectDiagramEnrichmentAsync(
            subscriptionId: null,
            resources,
            accessTokenValue,
            request.IncludeAppSettingsHosts,
            cancellationToken).ConfigureAwait(false);

        IReadOnlyList<AzureInventoryRecoveryServicesProtectedItemRow> recoveryServicesProtectedItems =
            await HostedAzureInventoryRecoveryServicesCollector
                .CollectAsync(_armReadClient, accessTokenValue, resources, _logger, cancellationToken)
                .ConfigureAwait(false);

        IReadOnlyList<HostedAzureArmResourceRecord> inventoryResources = resources;
        List<string> collectionWarnings = [];

        if (diagnosticSettingsResult.PartialCollection)
        {
            collectionWarnings.Add(AzureInventoryDiagnosticCompletenessWarningCodes.PartialCollection);
        }

        collectionWarnings.AddRange(avdSessionHostAssociations.CollectionWarnings);
        collectionWarnings.AddRange(staticSiteAndFabricAssociations.CollectionWarnings);
        collectionWarnings.AddRange(diagramEnrichment.CollectionWarnings);

        if (request.IncludeCost)
        {
            collectionWarnings.Add("actual-cost-requires-subscription-scope");
        }

        DateTimeOffset collectionTimestampUtc = TimeProvider.System.GetUtcNow();
        IReadOnlyList<AzureInventoryEntraGroupMembershipRow> entraGroupMemberships =
            await TryReadEntraGroupMembershipsAsync(
                credential,
                roleAssignments,
                managementGroupId,
                cancellationToken).ConfigureAwait(false);

        EntraAddCredentialGraphReadResult addCredentialSnapshot = await TryReadEntraAddCredentialSnapshotAsync(
            credential,
            managementGroupId,
            cancellationToken).ConfigureAwait(false);

        collectionWarnings.AddRange(defenderCompanionWarnings);
        collectionWarnings.AddRange(
            DefenderPlanCoverageWarnings.Create(defenderPricings, inventoryResources));

        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            subscriptionId: null,
            inventoryResources,
            request.IncludeCost,
            collectionTimestampUtc,
            subscriptionName: null,
            entraGroupMemberships,
            roleAssignments,
            networkAssociations,
            federatedCredentials,
            managementGroupId: managementGroupId,
            policyAssignments,
            diagnosticSettings,
            defenderSummaries,
            effectiveNetworkControls.Rows,
            adfLinkedServices,
            adfPipelineMetadata.Datasets,
            adfPipelineMetadata.PipelineFlows,
            adfExtendedMetadata.Triggers,
            adfExtendedMetadata.IntegrationRuntimes,
            adfExtendedMetadata.Dataflows,
            diagramEnrichment.EventGridSubscriptions,
            diagramEnrichment.LogicAppConnections,
            diagramEnrichment.MessagingAssociations,
            diagramEnrichment.PaasChildAssociations,
            diagramEnrichment.ServiceConnectorLinks,
            appSettingHosts: diagramEnrichment.AppSettingHosts,
            recoveryServicesProtectedItems: recoveryServicesProtectedItems,
            applicationOwners: addCredentialSnapshot.ApplicationOwners,
            directoryRoleAssignments: addCredentialSnapshot.DirectoryRoleAssignments,
            entraApplicationRegistrations: addCredentialSnapshot.ApplicationRegistrations,
            graphAppRoleAssignments: addCredentialSnapshot.GraphAppRoleAssignments,
            collectionWarnings: collectionWarnings,
            defenderPricings: defenderPricings,
            defenderScoreControls: defenderScoreControls,
            defenderAssessments: defenderAssessments,
            defenderAssessmentCounts: defenderAssessmentCounts,
            defenderSecurityContacts: defenderSecurityContacts,
            defenderGovernanceAssignments: defenderGovernanceAssignments,
            defenderComplianceStandards: defenderComplianceStandards,
            defenderComplianceControls: defenderComplianceControls,
            defenderAlerts: defenderAlerts,
            defenderAttackPaths: defenderAttackPaths,
            defenderVulnerabilityCounts: defenderVulnerabilityCounts,
            defenderVulnerabilityFindings: defenderVulnerabilityFindings);

        string fileName =
            $"archlucid-hosted-azure-mg-{managementGroupId.ToLowerInvariant()}-{collectionTimestampUtc:yyyyMMddHHmmss}.zip";

        return new HostedAzureExtractorCollectionResult
        {
            ZipBytes = zipBytes,
            OriginalFileName = fileName,
            ResourceCount = CountPackagedResources(inventoryResources)
        };
    }

    private async Task<HostedAzureDefenderCompanionCollectResult> CollectDefenderCompanionsOrEmptyAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        try
        {
            return await _armReadClient
                .CollectSubscriptionDefenderCompanionsAsync(accessToken, subscriptionId, cancellationToken)
                .ConfigureAwait(false)
                ?? new HostedAzureDefenderCompanionCollectResult();
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception)
        {
            return new HostedAzureDefenderCompanionCollectResult
            {
                SecurityContacts =
                [
                    new HostedAzureArmDefenderSecurityContactRecord
                    {
                        SubscriptionId = subscriptionId,
                        CollectionStatus = "Unavailable",
                    },
                ],
                Warnings =
                [
                    "defender-companions-failed",
                    "defender-security-contacts-not-collected",
                ],
            };
        }
    }

    private async Task<HostedAzureDefenderFollowOnCollectResult> CollectDefenderFollowOnOrEmptyAsync(
        string accessToken,
        string subscriptionId,
        IReadOnlyList<HostedAzureArmDefenderPricingRecord> pricings,
        IReadOnlyList<string> assessmentKeys,
        CancellationToken cancellationToken)
    {
        try
        {
            return await _armReadClient
                .CollectSubscriptionDefenderFollowOnAsync(
                    accessToken,
                    subscriptionId,
                    pricings,
                    assessmentKeys,
                    cancellationToken)
                .ConfigureAwait(false)
                ?? new HostedAzureDefenderFollowOnCollectResult();
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception)
        {
            return new HostedAzureDefenderFollowOnCollectResult
            {
                Warnings = ["defender-follow-on-failed"],
            };
        }
    }

    private static int CountPackagedResources(IReadOnlyList<HostedAzureArmResourceRecord> resources)
    {
        return resources.Count(static r => !AzureInventoryNeverShowArmTypes.ShouldOmitResource(r.ResourceType, r.ResourceId));
    }

    private async Task<HostedAzureInventoryAvdSessionHostAssociationCollectResult> CollectAvdSessionHostAssociationsAsync(
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        string accessToken,
        CancellationToken cancellationToken)
    {
        if (_armReadClient is not GetOnlyHostedAzureArmReadClient concreteArmReadClient)
        {
            return new HostedAzureInventoryAvdSessionHostAssociationCollectResult();
        }

        return await HostedAzureInventoryAvdSessionHostAssociationCollector.CollectAsync(
            concreteArmReadClient,
            accessToken,
            resources,
            _logger,
            cancellationToken).ConfigureAwait(false);
    }

    private async Task<HostedAzureDiagramEnrichmentCollectResult> CollectDiagramEnrichmentAsync(
        string? subscriptionId,
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        string accessToken,
        bool includeAppSettingsHosts,
        CancellationToken cancellationToken)
    {
        if (_armReadClient is not GetOnlyHostedAzureArmReadClient concreteArmReadClient)
        {
            return new HostedAzureDiagramEnrichmentCollectResult();
        }

        return await HostedAzureInventoryDiagramEnrichmentCollector.CollectAsync(
            concreteArmReadClient,
            accessToken,
            subscriptionId,
            resources,
            includeAppSettingsHosts,
            _logger,
            cancellationToken).ConfigureAwait(false);
    }

    private async Task<IReadOnlyList<JsonElement>> CollectPolicyDefinitionDocumentsAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<JsonElement> builtInDefinitions = await _armReadClient
            .ListBuiltInPolicyDefinitionDocumentsAsync(accessToken, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<JsonElement> subscriptionDefinitions = await _armReadClient
            .ListSubscriptionPolicyDefinitionDocumentsAsync(accessToken, subscriptionId, cancellationToken)
            .ConfigureAwait(false);

        List<JsonElement> merged = [];
        HashSet<string> seenIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonElement definition in builtInDefinitions.Concat(subscriptionDefinitions))
        {
            string? definitionId = TryReadJsonStringProperty(definition, "id");

            if (!string.IsNullOrWhiteSpace(definitionId))
            {
                if (!seenIds.Add(definitionId.Trim()))
                {
                    continue;
                }
            }

            merged.Add(definition);
        }

        return merged;
    }

    private static string? TryReadJsonStringProperty(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value)
            || value.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        return value.GetString();
    }

    private async Task<IReadOnlyList<AzureInventoryEntraGroupMembershipRow>> TryReadEntraGroupMembershipsAsync(
        TokenCredential credential,
        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> roleAssignments,
        string scopeLabel,
        CancellationToken cancellationToken)
    {
        EntraGroupMembershipGraphOptions graphOptions = _entraGroupMembershipGraphOptions.CurrentValue;

        if (!graphOptions.Enabled)
            return [];

        IReadOnlyList<string> seedGroupIds = ExtractGroupPrincipalIds(roleAssignments);

        EntraGroupMembershipGraphReadResult graphResult = await _entraGroupMembershipGraphReader
            .TryReadDirectMembershipsAsync(
                credential,
                seedGroupIds,
                graphOptions.MaxNestedDepth,
                cancellationToken)
            .ConfigureAwait(false);

        if (graphResult.Forbidden)
        {
            _logger.LogWarning(
                "Hosted Azure extractor skipped Entra group membership merge for scope {ScopeLabel}: {Warning}",
                scopeLabel,
                graphResult.Warnings.FirstOrDefault());

            return [];
        }

        return graphResult.Memberships;
    }

    private async Task<EntraAddCredentialGraphReadResult> TryReadEntraAddCredentialSnapshotAsync(
        TokenCredential credential,
        string scopeLabel,
        CancellationToken cancellationToken)
    {
        EntraAddCredentialGraphOptions graphOptions = _entraAddCredentialGraphOptions.CurrentValue;

        if (!graphOptions.Enabled)
        {
            return EntraAddCredentialGraphReadResult.Empty();
        }

        EntraAddCredentialGraphReadResult graphResult = await _entraAddCredentialGraphReader
            .TryReadSnapshotAsync(
                credential,
                graphOptions.MaxPaginationRequests,
                graphOptions.MaxApplicationOwnerRequests,
                cancellationToken)
            .ConfigureAwait(false);

        if (graphResult.Forbidden)
        {
            _logger.LogWarning(
                "Hosted Azure extractor skipped Entra add-credential Graph merge for scope {ScopeLabel}: {Warning}",
                scopeLabel,
                graphResult.Warnings.FirstOrDefault());

            return EntraAddCredentialGraphReadResult.Empty();
        }

        return graphResult;
    }

    private static IReadOnlyList<string> ExtractGroupPrincipalIds(
        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> roleAssignments)
    {
        HashSet<string> groupIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (HostedAzureArmRoleAssignmentRecord assignment in roleAssignments)
        {
            if (string.IsNullOrWhiteSpace(assignment.PrincipalId)
                || string.IsNullOrWhiteSpace(assignment.PrincipalType))
            {
                continue;
            }

            if (!assignment.PrincipalType.Equals("Group", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            groupIds.Add(assignment.PrincipalId.Trim());
        }

        return groupIds.OrderBy(static id => id, StringComparer.OrdinalIgnoreCase).ToList();
    }
}
