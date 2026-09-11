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
    IEntraGroupMembershipGraphReader entraGroupMembershipGraphReader,
    IOptionsMonitor<EntraGroupMembershipGraphOptions> entraGroupMembershipGraphOptions,
    ILogger<HostedAzureExtractorClient> logger) : IHostedAzureExtractorClient
{
    private const string ManagementScope = "https://management.azure.com/.default";

    private readonly IHostedAzureExtractorCredentialFactory _credentialFactory =
        credentialFactory ?? throw new ArgumentNullException(nameof(credentialFactory));

    private readonly IHostedAzureArmReadClient _armReadClient =
        armReadClient ?? throw new ArgumentNullException(nameof(armReadClient));

    private readonly IEntraGroupMembershipGraphReader _entraGroupMembershipGraphReader =
        entraGroupMembershipGraphReader ?? throw new ArgumentNullException(nameof(entraGroupMembershipGraphReader));

    private readonly IOptionsMonitor<EntraGroupMembershipGraphOptions> _entraGroupMembershipGraphOptions =
        entraGroupMembershipGraphOptions ?? throw new ArgumentNullException(nameof(entraGroupMembershipGraphOptions));

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

        IReadOnlyList<HostedAzureArmResourceRecord> resources = await _armReadClient
            .ListSubscriptionResourcesAsync(accessToken.Token, subscriptionId, cancellationToken)
            .ConfigureAwait(false);

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

        IReadOnlyList<HostedAzureArmDiagnosticSettingRecord> diagnosticSettings = await _armReadClient
            .ListDiagnosticSettingsAsync(accessToken.Token, resources, cancellationToken)
            .ConfigureAwait(false);

        List<HostedAzureArmNetworkAssociationRecord> networkAssociations =
            HostedAzureInventoryNetworkAssociationBuilder.Build(resources).ToList();

        networkAssociations.AddRange(HostedAzureInventoryNsgAllowRuleBuilder.Build(resources));

        if (request.IncludeCost && _logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Hosted Azure extractor skipping Cost Management merge for subscription {SubscriptionId}; hosted path is GET-only on management.azure.com.",
                subscriptionId);
        }

        DateTimeOffset collectionTimestampUtc = TimeProvider.System.GetUtcNow();
        IReadOnlyList<AzureInventoryEntraGroupMembershipRow> entraGroupMemberships =
            await TryReadEntraGroupMembershipsAsync(
                credential,
                roleAssignments,
                subscriptionId,
                cancellationToken).ConfigureAwait(false);

        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            subscriptionId,
            resources,
            request.IncludeCost,
            collectionTimestampUtc,
            subscriptionName,
            entraGroupMemberships,
            roleAssignments,
            networkAssociations,
            federatedCredentials,
            managementGroupId: null,
            policyAssignments,
            diagnosticSettings);

        string fileName =
            $"archlucid-hosted-azure-{subscriptionId.ToLowerInvariant()}-{collectionTimestampUtc:yyyyMMddHHmmss}.zip";

        return new HostedAzureExtractorCollectionResult
        {
            ZipBytes = zipBytes,
            OriginalFileName = fileName,
            ResourceCount = resources.Count
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
            IReadOnlyList<HostedAzureArmResourceRecord> subscriptionResources = await _armReadClient
                .ListSubscriptionResourcesAsync(accessTokenValue, subscriptionId, cancellationToken)
                .ConfigureAwait(false);

            resources.AddRange(subscriptionResources);

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
        }

        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> roleAssignments =
            HostedAzureRoleAssignmentMerger.Merge(standingRoleAssignments, eligibleRoleAssignments);

        IReadOnlyList<HostedAzureArmFederatedCredentialRecord> federatedCredentials = await _armReadClient
            .ListFederatedCredentialsAsync(accessTokenValue, resources, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<HostedAzureArmDiagnosticSettingRecord> diagnosticSettings = await _armReadClient
            .ListDiagnosticSettingsAsync(accessTokenValue, resources, cancellationToken)
            .ConfigureAwait(false);

        List<HostedAzureArmNetworkAssociationRecord> networkAssociations =
            HostedAzureInventoryNetworkAssociationBuilder.Build(resources).ToList();

        networkAssociations.AddRange(HostedAzureInventoryNsgAllowRuleBuilder.Build(resources));

        if (request.IncludeCost && _logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Hosted Azure extractor skipping Cost Management merge for management group {ManagementGroupId}; hosted path is GET-only on management.azure.com.",
                managementGroupId);
        }

        DateTimeOffset collectionTimestampUtc = TimeProvider.System.GetUtcNow();
        IReadOnlyList<AzureInventoryEntraGroupMembershipRow> entraGroupMemberships =
            await TryReadEntraGroupMembershipsAsync(
                credential,
                roleAssignments,
                managementGroupId,
                cancellationToken).ConfigureAwait(false);

        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            subscriptionId: null,
            resources,
            request.IncludeCost,
            collectionTimestampUtc,
            subscriptionName: null,
            entraGroupMemberships,
            roleAssignments,
            networkAssociations,
            federatedCredentials,
            managementGroupId: managementGroupId,
            policyAssignments,
            diagnosticSettings);

        string fileName =
            $"archlucid-hosted-azure-mg-{managementGroupId.ToLowerInvariant()}-{collectionTimestampUtc:yyyyMMddHHmmss}.zip";

        return new HostedAzureExtractorCollectionResult
        {
            ZipBytes = zipBytes,
            OriginalFileName = fileName,
            ResourceCount = resources.Count
        };
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
