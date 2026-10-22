using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

public sealed class AzureExtractorPackageInventoryReadResult
{
    public bool Succeeded
    {
        get;
        init;
    } = true;

    public string? Error
    {
        get;
        init;
    }

    public IReadOnlyList<AzureExtractorExtendedResourceRow> Resources
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> RoleAssignments
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> DiagnosticSettings
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> NetworkAssociations
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> PolicyAssignments
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryFederatedCredentialRow> FederatedCredentials
    {
        get;
        init;
    } = [];

    public bool FederatedCredentialsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryEntraGroupMembershipRow> EntraGroupMemberships
    {
        get;
        init;
    } = [];

    public bool EntraGroupMembershipsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryApplicationOwnerRow> ApplicationOwners
    {
        get;
        init;
    } = [];

    public bool ApplicationOwnersFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryDirectoryRoleAssignmentRow> DirectoryRoleAssignments
    {
        get;
        init;
    } = [];

    public bool DirectoryRoleAssignmentsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryEntraApplicationRegistrationRow> EntraApplicationRegistrations
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryGraphAppRoleAssignmentRow> GraphAppRoleAssignments
    {
        get;
        init;
    } = [];

    public bool GraphAppRoleAssignmentsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<JsonElement> DefenderSummary
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> DefenderPricings
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> DefenderScoreControls
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> DefenderAssessments
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> DefenderAssessmentCounts
    {
        get;
        init;
    } = [];

    public IReadOnlyList<JsonElement> DefenderSecurityContacts
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryEffectiveNetworkControlRow> EffectiveNetworkControls
    {
        get;
        init;
    } = [];

    public bool EffectiveNetworkControlsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryAdfLinkedServiceRow> AdfLinkedServices
    {
        get;
        init;
    } = [];

    public bool AdfLinkedServicesFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryAdfDatasetRow> AdfDatasets
    {
        get;
        init;
    } = [];

    public bool AdfDatasetsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryAdfPipelineFlowRow> AdfPipelineFlows
    {
        get;
        init;
    } = [];

    public bool AdfPipelineFlowsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryAdfTriggerRow> AdfTriggers
    {
        get;
        init;
    } = [];

    public bool AdfTriggersFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryAdfIntegrationRuntimeRow> AdfIntegrationRuntimes
    {
        get;
        init;
    } = [];

    public bool AdfIntegrationRuntimesFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryAdfDataflowRow> AdfDataflows
    {
        get;
        init;
    } = [];

    public bool AdfDataflowsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryEventGridSubscriptionRow> EventGridSubscriptions
    {
        get;
        init;
    } = [];

    public bool EventGridSubscriptionsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryLogicAppConnectionRow> LogicAppConnections
    {
        get;
        init;
    } = [];

    public bool LogicAppConnectionsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryMessagingAssociationRow> MessagingAssociations
    {
        get;
        init;
    } = [];

    public bool MessagingAssociationsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryPaasChildAssociationRow> PaasChildAssociations
    {
        get;
        init;
    } = [];

    public bool PaasChildAssociationsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryServiceConnectorLinkRow> ServiceConnectorLinks
    {
        get;
        init;
    } = [];

    public bool ServiceConnectorLinksFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryAppSettingHostRow> AppSettingHosts
    {
        get;
        init;
    } = [];

    public bool AppSettingHostsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryDependencyObservationRow> DependencyObservations
    {
        get;
        init;
    } = [];

    public bool DependencyObservationsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventorySqlDatabasePrincipalRow> SqlDatabasePrincipals
    {
        get;
        init;
    } = [];

    public bool SqlDatabasePrincipalsFilePresent
    {
        get;
        init;
    }

    public IReadOnlyList<AzureInventoryRecoveryServicesProtectedItemRow> RecoveryServicesProtectedItems
    {
        get;
        init;
    } = [];

    public bool RecoveryServicesProtectedItemsFilePresent
    {
        get;
        init;
    }

    public static AzureExtractorPackageInventoryReadResult Failed(string error) =>
        new() { Succeeded = false, Error = error };
}
