using ArchLucid.Core.AzureExtractor;

using System.IO.Compression;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Builds schema v1 Azure extractor ZIP bytes matching the PowerShell collector layout.
/// </summary>
public static class HostedAzureExtractorZipBuilder
{
    private const int SchemaVersion = AzureExtractorZipSchema.Version2;

    private const string HostedScriptVersion = "hosted-1.0.0";

    private static readonly JsonSerializerOptions SerializerOptions =
        new()
        {
            WriteIndented = true
        };

    public static byte[] BuildZip(
        string? subscriptionId,
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        bool includeCostRequested,
        DateTimeOffset collectionTimestampUtc,
        string? subscriptionName = null,
        IReadOnlyList<AzureInventoryEntraGroupMembershipRow>? entraGroupMemberships = null,
        IReadOnlyList<HostedAzureArmRoleAssignmentRecord>? roleAssignments = null,
        IReadOnlyList<HostedAzureArmNetworkAssociationRecord>? networkAssociations = null,
        IReadOnlyList<HostedAzureArmFederatedCredentialRecord>? federatedCredentials = null,
        string? managementGroupId = null,
        IReadOnlyList<HostedAzureArmPolicyAssignmentRecord>? policyAssignments = null,
        IReadOnlyList<HostedAzureArmDiagnosticSettingRecord>? diagnosticSettings = null,
        IReadOnlyList<HostedAzureArmDefenderSummaryRecord>? defenderSummaries = null,
        IReadOnlyList<HostedAzureArmEffectiveNetworkControlRecord>? effectiveNetworkControls = null,
        IReadOnlyList<AzureInventoryAdfLinkedServiceRow>? adfLinkedServices = null,
        IReadOnlyList<AzureInventoryAdfDatasetRow>? adfDatasets = null,
        IReadOnlyList<AzureInventoryAdfPipelineFlowRow>? adfPipelineFlows = null,
        IReadOnlyList<AzureInventoryAdfTriggerRow>? adfTriggers = null,
        IReadOnlyList<AzureInventoryAdfIntegrationRuntimeRow>? adfIntegrationRuntimes = null,
        IReadOnlyList<AzureInventoryAdfDataflowRow>? adfDataflows = null,
        IReadOnlyList<AzureInventoryEventGridSubscriptionRow>? eventGridSubscriptions = null,
        IReadOnlyList<AzureInventoryLogicAppConnectionRow>? logicAppConnections = null,
        IReadOnlyList<AzureInventoryMessagingAssociationRow>? messagingAssociations = null,
        IReadOnlyList<AzureInventoryPaasChildAssociationRow>? paasChildAssociations = null,
        IReadOnlyList<AzureInventoryServiceConnectorLinkRow>? serviceConnectorLinks = null,
        IReadOnlyList<AzureInventoryAppSettingHostRow>? appSettingHosts = null,
        IReadOnlyList<AzureInventoryRecoveryServicesProtectedItemRow>? recoveryServicesProtectedItems = null,
        IReadOnlyList<AzureInventoryApplicationOwnerRow>? applicationOwners = null,
        IReadOnlyList<AzureInventoryDirectoryRoleAssignmentRow>? directoryRoleAssignments = null,
        IReadOnlyList<AzureInventoryEntraApplicationRegistrationRow>? entraApplicationRegistrations = null,
        IReadOnlyList<AzureInventoryGraphAppRoleAssignmentRow>? graphAppRoleAssignments = null,
        IReadOnlyList<string>? collectionWarnings = null,
        HostedAzureActualCostSummary? actualCostSummary = null,
        HostedAzurePolicyComplianceDocument? policyComplianceDocument = null,
        IReadOnlyList<JsonElement>? policyDefinitionDocuments = null,
        IReadOnlyList<JsonElement>? policyAssignmentDocuments = null,
        IReadOnlyList<HostedAzureArmDefenderPricingRecord>? defenderPricings = null,
        IReadOnlyList<HostedAzureArmDefenderScoreControlRecord>? defenderScoreControls = null,
        IReadOnlyList<HostedAzureArmDefenderAssessmentRecord>? defenderAssessments = null,
        IReadOnlyList<HostedAzureArmDefenderAssessmentCountRecord>? defenderAssessmentCounts = null,
        IReadOnlyList<HostedAzureArmDefenderSecurityContactRecord>? defenderSecurityContacts = null)
    {
        bool hasSubscriptionId = !string.IsNullOrWhiteSpace(subscriptionId);
        bool hasManagementGroupId = !string.IsNullOrWhiteSpace(managementGroupId);

        if (hasSubscriptionId == hasManagementGroupId)
        {
            throw new ArgumentException("Specify exactly one of subscriptionId or managementGroupId.");
        }

        string scope = hasManagementGroupId
            ? $"/providers/Microsoft.Management/managementGroups/{managementGroupId!.Trim()}"
            : $"/subscriptions/{subscriptionId!.Trim()}";
        List<string> switchesUsed = [];

        if (includeCostRequested)
            switchesUsed.Add("IncludeCost");

        Dictionary<string, object?> manifest = new(StringComparer.Ordinal)
        {
            ["schemaVersion"] = SchemaVersion,
            ["scriptVersion"] = HostedScriptVersion,
            ["collectionTimestamp"] = collectionTimestampUtc.ToString("o"),
            ["subscriptionId"] = hasSubscriptionId ? subscriptionId!.Trim() : null,
            ["subscriptionName"] = AzureExtractorSubscriptionDisplayName.Normalize(subscriptionName),
            ["managementGroupId"] = hasManagementGroupId ? managementGroupId!.Trim() : null,
            ["scope"] = scope,
            ["switchesUsed"] = switchesUsed,
            ["azModuleVersion"] = "hosted-extractor",
            ["completenessScore"] = 1.0,
            ["warnings"] = (collectionWarnings ?? []).ToArray(),
            ["errors"] = Array.Empty<string>(),
            ["resourceCount"] = resources.Count(r => !AzureInventoryNeverShowArmTypes.ShouldOmitResource(r.ResourceType, r.ResourceId)),
            ["captureMethod"] = "HostedReader",
            ["collectorVersion"] = HostedScriptVersion,
        };

        if (includeCostRequested)
        {
            manifest["actualCostSummary"] = actualCostSummary is null
                ? null
                : new Dictionary<string, object?>(StringComparer.Ordinal)
                {
                    ["TotalActualCostUsd"] = actualCostSummary.TotalActualCostUsd,
                    ["CurrencyCode"] = actualCostSummary.CurrencyCode,
                    ["BillingPeriod"] = actualCostSummary.BillingPeriod,
                    ["BreakdownByServiceName"] = actualCostSummary.BreakdownByServiceName
                        .Select(static row => new Dictionary<string, object?>(StringComparer.Ordinal)
                        {
                            ["ServiceName"] = row.ServiceName,
                            ["PreTaxCost"] = row.PreTaxCost,
                        })
                        .ToArray(),
                };
        }

        // Omit never-show ARM types from packaged resources while associations may still reference them.
        object[] resourceRows = resources
            .Where(static r => !AzureInventoryNeverShowArmTypes.ShouldOmitResource(r.ResourceType, r.ResourceId))
            .Select(static r => new
            {
                resourceType = r.ResourceType,
                resourceId = r.ResourceId,
                name = r.Name,
                location = r.Location,
                sku = r.Sku,
                tags = r.Tags,
                properties = r.Properties
            })
            .ToArray<object>();

        manifest["resourceCount"] = resourceRows.Length;

        Dictionary<string, object?> policyCompliance = BuildPolicyCompliancePayload(
            scope,
            collectionTimestampUtc,
            policyComplianceDocument);

        const string readme = """
                              ArchLucid hosted Azure extractor package (Tier 2 — Workload Identity Federation).
                              Generated by ArchLucid's cloud-hosted read-only collector. No customer client secrets cross the boundary.
                              Upload via POST /v1/azure-extractor/upload or the hosted run endpoint.
                              """;

        object[] entraMembershipRows = (entraGroupMemberships ?? [])
            .Select(static row => new
            {
                memberId = row.MemberId,
                groupId = row.GroupId,
                provenanceKind = row.ProvenanceKind.ToString(),
                evidenceHashSha256 = row.EvidenceHashSha256 is null
                    ? null
                    : Convert.ToHexStringLower(row.EvidenceHashSha256),
            })
            .ToArray<object>();

        object[] applicationOwnerRows = (applicationOwners ?? [])
            .Select(static row => new
            {
                appObjectId = row.AppObjectId,
                appId = row.AppId,
                ownerId = row.OwnerId,
                provenanceKind = row.ProvenanceKind.ToString(),
                evidenceHashSha256 = row.EvidenceHashSha256 is null
                    ? null
                    : Convert.ToHexStringLower(row.EvidenceHashSha256),
            })
            .ToArray<object>();

        object[] directoryRoleAssignmentRows = (directoryRoleAssignments ?? [])
            .Select(static row => new
            {
                principalId = row.PrincipalId,
                principalType = row.PrincipalType,
                roleDefinitionId = row.RoleDefinitionId,
                roleDefinitionTemplateId = row.RoleDefinitionTemplateId,
                directoryScopeId = row.DirectoryScopeId,
                roleName = row.RoleName,
                pimEligibilityKind = row.PimEligibilityKind,
                provenanceKind = row.ProvenanceKind.ToString(),
                evidenceHashSha256 = row.EvidenceHashSha256 is null
                    ? null
                    : Convert.ToHexStringLower(row.EvidenceHashSha256),
            })
            .ToArray<object>();

        List<object> graphCompanionRows = [];

        foreach (AzureInventoryEntraApplicationRegistrationRow registration in entraApplicationRegistrations ?? [])
        {
            graphCompanionRows.Add(new
            {
                appObjectId = registration.AppObjectId,
                appId = registration.AppId,
                servicePrincipalObjectId = registration.ServicePrincipalObjectId,
            });
        }

        foreach (AzureInventoryGraphAppRoleAssignmentRow assignment in graphAppRoleAssignments ?? [])
        {
            graphCompanionRows.Add(new
            {
                principalId = assignment.PrincipalId,
                resourceId = assignment.ResourceId,
                appRoleId = assignment.AppRoleId,
                provenanceKind = assignment.ProvenanceKind.ToString(),
                evidenceHashSha256 = assignment.EvidenceHashSha256 is null
                    ? null
                    : Convert.ToHexStringLower(assignment.EvidenceHashSha256),
            });
        }

        object[] roleAssignmentRows = (roleAssignments ?? [])
            .Select(static row => new
            {
                scope = row.Scope,
                principalId = row.PrincipalId,
                principalType = row.PrincipalType,
                roleDefinitionId = row.RoleDefinitionId,
                roleName = row.RoleName,
                pimEligibilityKind = row.PimEligibilityKind,
            })
            .ToArray<object>();

        object[] networkAssociationRows = (networkAssociations ?? [])
            .Select(static row => new
            {
                fromResourceId = row.FromResourceId,
                toResourceId = row.ToResourceId,
                associationType = row.AssociationType,
                ruleName = row.RuleName,
            })
            .ToArray<object>();

        object[] federatedCredentialRows = (federatedCredentials ?? [])
            .Select(static row => new
            {
                issuer = row.Issuer,
                subject = row.Subject,
                principalId = row.PrincipalId,
                appId = row.AppId,
                parentResourceId = row.ParentResourceId,
                credentialName = row.CredentialName,
                provenanceKind = "ObservedFact",
            })
            .ToArray<object>();

        object[] policyAssignmentRows = (policyAssignments ?? [])
            .Select(static row => new
            {
                scope = row.Scope,
                policyDefinitionId = row.PolicyDefinitionId,
                name = row.Name,
                assignmentId = row.AssignmentId,
            })
            .ToArray<object>();

        object[] diagnosticSettingRows = (diagnosticSettings ?? [])
            .Select(static row => new
            {
                targetResourceId = row.TargetResourceId,
                name = row.Name,
                workspaceId = row.WorkspaceId,
                storageAccountId = row.StorageAccountId,
                eventHubAuthorizationRuleId = row.EventHubAuthorizationRuleId,
            })
            .ToArray<object>();

        object[] defenderSummaryRows = (defenderSummaries ?? [])
            .Select(static row => new
            {
                resourceId = row.ResourceId,
                secureScore = row.SecureScore,
            })
            .ToArray<object>();

        object[] defenderPricingRows = (defenderPricings ?? [])
            .Select(static row => new
            {
                subscriptionId = row.SubscriptionId,
                pricingName = row.PricingName,
                tier = row.Tier,
                extensions = row.Extensions,
            })
            .ToArray<object>();

        object[] defenderScoreControlRows = (defenderScoreControls ?? [])
            .Select(static row => new
            {
                subscriptionId = row.SubscriptionId,
                scoreName = row.ScoreName,
                controlName = row.ControlName,
                displayName = row.DisplayName,
                current = row.CurrentScore,
                max = row.MaxScore,
                percentage = row.Percentage,
                weight = row.Weight,
                unhealthyResourceCount = row.UnhealthyResourceCount,
                healthyResourceCount = row.HealthyResourceCount,
            })
            .ToArray<object>();

        object[] defenderAssessmentRows = (defenderAssessments ?? [])
            .Select(static row => new
            {
                subscriptionId = row.SubscriptionId,
                assessmentKey = row.AssessmentKey,
                displayName = row.DisplayName,
                severity = row.Severity,
                status = row.Status,
                statusCause = row.StatusCause,
                category = row.Category,
                resourceId = row.ResourceId,
            })
            .ToArray<object>();

        object[] defenderAssessmentCountRows = (defenderAssessmentCounts ?? [])
            .Select(static row => new
            {
                subscriptionId = row.SubscriptionId,
                assessmentKey = row.AssessmentKey,
                displayName = row.DisplayName,
                severity = row.Severity,
                healthyCount = row.HealthyCount,
                unhealthyCount = row.UnhealthyCount,
                notApplicableCount = row.NotApplicableCount,
            })
            .ToArray<object>();

        object[] defenderSecurityContactRows = (defenderSecurityContacts ?? [])
            .Select(static row => new
            {
                subscriptionId = row.SubscriptionId,
                collectionStatus = row.CollectionStatus,
                emailCount = row.EmailCount,
                emails = row.Emails,
                alertsToAdmins = row.AlertsToAdmins,
                minimalSeverity = row.MinimalSeverity,
                notificationRoles = row.NotificationRoles,
            })
            .ToArray<object>();

        object[] effectiveNetworkControlRows = (effectiveNetworkControls ?? [])
            .Select(static row => new
            {
                nicResourceId = row.NicResourceId,
                kind = row.Kind,
                collectionStatus = row.CollectionStatus,
                effectiveResourceId = row.EffectiveResourceId,
                payloadHashSha256 = row.PayloadHashSha256,
            })
            .ToArray<object>();

        object[] adfLinkedServiceRows = (adfLinkedServices ?? [])
            .Select(static row => new
            {
                factoryResourceId = row.FactoryResourceId,
                linkedServiceResourceId = row.LinkedServiceResourceId,
                linkedServiceName = row.LinkedServiceName,
                linkedServiceType = row.LinkedServiceType,
                targetResourceId = row.TargetResourceId,
                targetHost = row.TargetHost,
                keyVaultResourceId = row.KeyVaultResourceId,
                hostInKeyVault = row.HostInKeyVault,
                integrationRuntimeName = row.IntegrationRuntimeName,
                collectionStatus = row.CollectionStatus,
                warningCode = row.WarningCode,
            })
            .ToArray<object>();

        object[] adfDatasetRows = (adfDatasets ?? [])
            .Select(static row => new
            {
                factoryResourceId = row.FactoryResourceId,
                datasetResourceId = row.DatasetResourceId,
                datasetName = row.DatasetName,
                linkedServiceName = row.LinkedServiceName,
                locationKind = row.LocationKind,
                containerOrFilesystem = row.ContainerOrFilesystem,
                folderPath = row.FolderPath,
                tableName = row.TableName,
                schemaName = row.SchemaName,
                collectionStatus = row.CollectionStatus,
                warningCode = row.WarningCode,
            })
            .ToArray<object>();

        object[] adfPipelineFlowRows = (adfPipelineFlows ?? [])
            .Select(static row => new
            {
                factoryResourceId = row.FactoryResourceId,
                pipelineResourceId = row.PipelineResourceId,
                pipelineName = row.PipelineName,
                activityName = row.ActivityName,
                activityType = row.ActivityType,
                flowDirection = row.FlowDirection,
                datasetName = row.DatasetName,
                collectionStatus = row.CollectionStatus,
                warningCode = row.WarningCode,
            })
            .ToArray<object>();

        object[] adfTriggerRows = (adfTriggers ?? [])
            .Select(static row => new
            {
                factoryResourceId = row.FactoryResourceId,
                triggerResourceId = row.TriggerResourceId,
                triggerName = row.TriggerName,
                triggerType = row.TriggerType,
                pipelineNames = row.PipelineNames,
                sourceResourceId = row.SourceResourceId,
                sourceHost = row.SourceHost,
                scheduleRecurrence = row.ScheduleRecurrence,
                collectionStatus = row.CollectionStatus,
                warningCode = row.WarningCode,
            })
            .ToArray<object>();

        object[] adfIntegrationRuntimeRows = (adfIntegrationRuntimes ?? [])
            .Select(static row => new
            {
                factoryResourceId = row.FactoryResourceId,
                integrationRuntimeResourceId = row.IntegrationRuntimeResourceId,
                name = row.Name,
                kind = row.Kind,
                subnetId = row.SubnetId,
                state = row.State,
                collectionStatus = row.CollectionStatus,
                warningCode = row.WarningCode,
            })
            .ToArray<object>();

        object[] adfDataflowRows = (adfDataflows ?? [])
            .Select(static row => new
            {
                factoryResourceId = row.FactoryResourceId,
                dataflowResourceId = row.DataflowResourceId,
                dataflowName = row.DataflowName,
                sourceLinkedServiceNames = row.SourceLinkedServiceNames,
                sinkLinkedServiceNames = row.SinkLinkedServiceNames,
                collectionStatus = row.CollectionStatus,
                warningCode = row.WarningCode,
            })
            .ToArray<object>();

        object[] eventGridSubscriptionRows = (eventGridSubscriptions ?? [])
            .Select(static row => new
            {
                sourceResourceId = row.SourceResourceId,
                subscriptionName = row.SubscriptionName,
                subscriptionResourceId = row.SubscriptionResourceId,
                destinationResourceId = row.DestinationResourceId,
                destinationHost = row.DestinationHost,
                destinationKind = row.DestinationKind,
                collectionStatus = row.CollectionStatus,
                warningCode = row.WarningCode,
            })
            .ToArray<object>();

        object[] logicAppConnectionRows = (logicAppConnections ?? [])
            .Select(static row => new
            {
                workflowResourceId = row.WorkflowResourceId,
                workflowName = row.WorkflowName,
                connectionName = row.ConnectionName,
                connectionResourceId = row.ConnectionResourceId,
                targetResourceId = row.TargetResourceId,
                targetHost = row.TargetHost,
                collectionStatus = row.CollectionStatus,
                warningCode = row.WarningCode,
            })
            .ToArray<object>();

        object[] messagingAssociationRows = (messagingAssociations ?? [])
            .Select(static row => new
            {
                parentResourceId = row.ParentResourceId,
                childResourceId = row.ChildResourceId,
                childName = row.ChildName,
                childType = row.ChildType,
                associationType = row.AssociationType,
                captureStorageAccountId = row.CaptureStorageAccountId,
                collectionStatus = row.CollectionStatus,
                warningCode = row.WarningCode,
            })
            .ToArray<object>();

        object[] paasChildAssociationRows = (paasChildAssociations ?? [])
            .Select(static row => new
            {
                parentResourceId = row.ParentResourceId,
                childResourceId = row.ChildResourceId,
                childName = row.ChildName,
                childType = row.ChildType,
                associationType = row.AssociationType,
                collectionStatus = row.CollectionStatus,
                warningCode = row.WarningCode,
            })
            .ToArray<object>();

        object[] serviceConnectorLinkRows = (serviceConnectorLinks ?? [])
            .Select(static row => new
            {
                sourceResourceId = row.SourceResourceId,
                linkerName = row.LinkerName,
                linkerResourceId = row.LinkerResourceId,
                targetResourceId = row.TargetResourceId,
                collectionStatus = row.CollectionStatus,
                warningCode = row.WarningCode,
            })
            .ToArray<object>();

        object[] appSettingHostRows = (appSettingHosts ?? [])
            .Select(static row => new
            {
                siteResourceId = row.SiteResourceId,
                settingName = row.SettingName,
                host = row.Host,
                keyVaultHost = row.KeyVaultHost,
                secretName = row.SecretName,
                collectionStatus = row.CollectionStatus,
                warningCode = row.WarningCode,
            })
            .ToArray<object>();

        object[] recoveryServicesProtectedItemRows = (recoveryServicesProtectedItems ?? [])
            .Select(static row => new
            {
                vaultResourceId = row.VaultResourceId,
                itemKind = row.ItemKind,
                sourceResourceId = row.SourceResourceId,
                targetRegion = row.TargetRegion,
                targetResourceId = row.TargetResourceId,
                collectionStatus = row.CollectionStatus,
                warningCode = row.WarningCode,
            })
            .ToArray<object>();

        using MemoryStream zipStream = new();

        using (ZipArchive archive = new(zipStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddUtf8Entry(archive, AzureExtractorPackageZipEntryNames.Manifest, JsonSerializer.Serialize(manifest, SerializerOptions));
            AddUtf8Entry(archive, AzureExtractorPackageZipEntryNames.Resources, JsonSerializer.Serialize(resourceRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.RoleAssignments,
                JsonSerializer.Serialize(roleAssignmentRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.NetworkAssociations,
                JsonSerializer.Serialize(networkAssociationRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.DiagnosticSettings,
                JsonSerializer.Serialize(diagnosticSettingRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.PolicyAssignments,
                JsonSerializer.Serialize(policyAssignmentRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.FederatedCredentials,
                JsonSerializer.Serialize(federatedCredentialRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.DefenderSummary,
                JsonSerializer.Serialize(defenderSummaryRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.DefenderPricings,
                JsonSerializer.Serialize(defenderPricingRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.DefenderScoreControls,
                JsonSerializer.Serialize(defenderScoreControlRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.DefenderAssessments,
                JsonSerializer.Serialize(defenderAssessmentRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.DefenderAssessmentCounts,
                JsonSerializer.Serialize(defenderAssessmentCountRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.DefenderSecurityContacts,
                JsonSerializer.Serialize(defenderSecurityContactRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.EntraGroupMemberships,
                JsonSerializer.Serialize(entraMembershipRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.ApplicationOwners,
                JsonSerializer.Serialize(applicationOwnerRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.DirectoryRoleAssignments,
                JsonSerializer.Serialize(directoryRoleAssignmentRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.GraphAppRoleAssignments,
                JsonSerializer.Serialize(graphCompanionRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.EffectiveNetworkControls,
                JsonSerializer.Serialize(effectiveNetworkControlRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.AdfLinkedServices,
                JsonSerializer.Serialize(adfLinkedServiceRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.AdfDatasets,
                JsonSerializer.Serialize(adfDatasetRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.AdfPipelineFlows,
                JsonSerializer.Serialize(adfPipelineFlowRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.AdfTriggers,
                JsonSerializer.Serialize(adfTriggerRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.AdfIntegrationRuntimes,
                JsonSerializer.Serialize(adfIntegrationRuntimeRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.AdfDataflows,
                JsonSerializer.Serialize(adfDataflowRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.EventGridSubscriptions,
                JsonSerializer.Serialize(eventGridSubscriptionRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.LogicAppConnections,
                JsonSerializer.Serialize(logicAppConnectionRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.MessagingAssociations,
                JsonSerializer.Serialize(messagingAssociationRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.PaasChildAssociations,
                JsonSerializer.Serialize(paasChildAssociationRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.ServiceConnectorLinks,
                JsonSerializer.Serialize(serviceConnectorLinkRows, SerializerOptions));
            AddUtf8Entry(
                archive,
                AzureExtractorPackageZipEntryNames.RecoveryServicesProtectedItems,
                JsonSerializer.Serialize(recoveryServicesProtectedItemRows, SerializerOptions));

            if (appSettingHosts is not null)
            {
                AddUtf8Entry(
                    archive,
                    AzureExtractorPackageZipEntryNames.AppSettingsHosts,
                    JsonSerializer.Serialize(appSettingHostRows, SerializerOptions));
            }

            AddUtf8Entry(archive, "policy-compliance.json", JsonSerializer.Serialize(policyCompliance, SerializerOptions));

            if (policyDefinitionDocuments is not null || policyAssignmentDocuments is not null)
            {
                object[] definitionRows = policyDefinitionDocuments?.Select(static element => (object)element).ToArray()
                    ?? Array.Empty<object>();

                object[] assignmentRows = policyAssignmentDocuments?.Select(static element => (object)element).ToArray()
                    ?? Array.Empty<object>();

                Dictionary<string, object> policyDocument = new(StringComparer.Ordinal)
                {
                    ["policyDefinitions"] = definitionRows,
                    ["policyAssignments"] = assignmentRows,
                };

                AddUtf8Entry(archive, "policy.json", JsonSerializer.Serialize(policyDocument, SerializerOptions));
            }

            AddUtf8Entry(archive, "README.txt", readme);
        }

        return zipStream.ToArray();
    }

    private static Dictionary<string, object?> BuildPolicyCompliancePayload(
        string scope,
        DateTimeOffset collectionTimestampUtc,
        HostedAzurePolicyComplianceDocument? policyComplianceDocument)
    {
        if (policyComplianceDocument is not null)
        {
            return new Dictionary<string, object?>(StringComparer.Ordinal)
            {
                ["policyComplianceSchemaVersion"] = policyComplianceDocument.PolicyComplianceSchemaVersion,
                ["collectionTimestampUtc"] = policyComplianceDocument.CollectionTimestampUtc,
                ["scope"] = policyComplianceDocument.Scope,
                ["managementPlane"] = policyComplianceDocument.ManagementPlane,
                ["apiShape"] = policyComplianceDocument.ApiShape,
                ["readerNote"] = policyComplianceDocument.ReaderNote,
                ["recordCount"] = policyComplianceDocument.RecordCount,
                ["records"] = policyComplianceDocument.Records,
            };
        }

        return new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["policyComplianceSchemaVersion"] = 1,
            ["collectionTimestampUtc"] = collectionTimestampUtc.ToString("o"),
            ["scope"] = scope,
            ["managementPlane"] = "AzurePolicyInsights",
            ["apiShape"] = "policyStates/latest/queryResults",
            ["readerNote"] =
                "Policy compliance was not collected for this hosted run (subscription scope required).",
            ["recordCount"] = 0,
            ["records"] = Array.Empty<object>(),
        };
    }

    private static void AddUtf8Entry(ZipArchive archive, string entryName, string content)
    {
        ZipArchiveEntry entry = archive.CreateEntry(entryName, CompressionLevel.Optimal);

        using Stream entryStream = entry.Open();

        byte[] bytes = Encoding.UTF8.GetBytes(content);

        entryStream.Write(bytes, 0, bytes.Length);
    }
}
