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

        TokenCredential credential = _credentialFactory.CreateCredential(
            request.CustomerTenantId,
            request.CustomerAppId);

        AccessToken accessToken = await credential
            .GetTokenAsync(new TokenRequestContext([ManagementScope]), cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<HostedAzureArmResourceRecord> resources = await _armReadClient
            .ListSubscriptionResourcesAsync(accessToken.Token, request.SubscriptionId, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> standingRoleAssignments = await _armReadClient
            .ListSubscriptionRoleAssignmentsAsync(accessToken.Token, request.SubscriptionId, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> eligibleRoleAssignments = await _armReadClient
            .ListSubscriptionRoleEligibilitySchedulesAsync(accessToken.Token, request.SubscriptionId, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> roleAssignments =
            MergeRoleAssignmentRows(standingRoleAssignments, eligibleRoleAssignments);

        string? subscriptionName = await _armReadClient
            .TryGetSubscriptionDisplayNameAsync(accessToken.Token, request.SubscriptionId, cancellationToken)
            .ConfigureAwait(false);

        IReadOnlyList<HostedAzureArmFederatedCredentialRecord> federatedCredentials = await _armReadClient
            .ListFederatedCredentialsAsync(accessToken.Token, resources, cancellationToken)
            .ConfigureAwait(false);

        List<HostedAzureArmNetworkAssociationRecord> networkAssociations =
            HostedAzureInventoryNetworkAssociationBuilder.Build(resources).ToList();

        networkAssociations.AddRange(HostedAzureInventoryNsgAllowRuleBuilder.Build(resources));

        if (request.IncludeCost && _logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Hosted Azure extractor skipping Cost Management merge for subscription {SubscriptionId}; hosted path is GET-only on management.azure.com.",
                request.SubscriptionId);
        }

        DateTimeOffset collectionTimestampUtc = TimeProvider.System.GetUtcNow();
        IReadOnlyList<AzureInventoryEntraGroupMembershipRow> entraGroupMemberships = [];

        EntraGroupMembershipGraphOptions graphOptions = _entraGroupMembershipGraphOptions.CurrentValue;

        if (graphOptions.Enabled)
        {
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
                    "Hosted Azure extractor skipped Entra group membership merge for subscription {SubscriptionId}: {Warning}",
                    request.SubscriptionId,
                    graphResult.Warnings.FirstOrDefault());
            }
            else
            {
                entraGroupMemberships = graphResult.Memberships;
            }
        }

        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            request.SubscriptionId,
            resources,
            request.IncludeCost,
            collectionTimestampUtc,
            subscriptionName,
            entraGroupMemberships,
            roleAssignments,
            networkAssociations,
            federatedCredentials);

        string fileName =
            $"archlucid-hosted-azure-{request.SubscriptionId.Trim().ToLowerInvariant()}-{collectionTimestampUtc:yyyyMMddHHmmss}.zip";

        return new HostedAzureExtractorCollectionResult
        {
            ZipBytes = zipBytes,
            OriginalFileName = fileName,
            ResourceCount = resources.Count
        };
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

    private static IReadOnlyList<HostedAzureArmRoleAssignmentRecord> MergeRoleAssignmentRows(
        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> standingAssignments,
        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> eligibleAssignments)
    {
        Dictionary<string, HostedAzureArmRoleAssignmentRecord> merged =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (HostedAzureArmRoleAssignmentRecord assignment in eligibleAssignments)
        {
            merged[BuildRoleAssignmentKey(assignment)] = assignment;
        }

        foreach (HostedAzureArmRoleAssignmentRecord assignment in standingAssignments)
        {
            merged[BuildRoleAssignmentKey(assignment)] = assignment;
        }

        return merged.Values.ToList();
    }

    private static string BuildRoleAssignmentKey(HostedAzureArmRoleAssignmentRecord assignment) =>
        $"{assignment.Scope}|{assignment.PrincipalId}|{assignment.RoleDefinitionId}";
}
