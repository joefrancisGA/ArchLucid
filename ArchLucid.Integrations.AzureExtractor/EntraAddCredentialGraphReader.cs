using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using Azure.Core;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed class EntraAddCredentialGraphReader(
    HttpClient httpClient,
    ILogger<EntraAddCredentialGraphReader> logger) : IEntraAddCredentialGraphReader
{
    public async Task<EntraAddCredentialGraphReadResult> TryReadSnapshotAsync(
        TokenCredential credential,
        int maxPaginationRequests,
        int maxApplicationOwnerRequests,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(credential);

        if (maxPaginationRequests <= 0)
        {
            maxPaginationRequests = 64;
        }

        AccessToken accessToken = await credential
            .GetTokenAsync(
                new TokenRequestContext([EntraAddCredentialGraphScopes.GraphDefaultScope]),
                cancellationToken)
            .ConfigureAwait(false);

        bool partial = false;
        List<AzureInventoryApplicationOwnerRow> applicationOwners = [];
        List<AzureInventoryDirectoryRoleAssignmentRow> directoryRoleAssignments = [];
        List<AzureInventoryEntraApplicationRegistrationRow> applicationRegistrations = [];
        List<AzureInventoryGraphAppRoleAssignmentRow> graphAppRoleAssignments = [];

        EntraAddCredentialGraphPageReadResult applicationsResult = await ReadApplicationsAsync(
            accessToken.Token,
            maxPaginationRequests,
            cancellationToken).ConfigureAwait(false);

        partial |= applicationsResult.PartialCollection;
        if (applicationsResult.Forbidden)
        {
            return new EntraAddCredentialGraphReadResult
            {
                Forbidden = true,
                Warnings = [SecurityEvidenceAddCredentialAdapterWarnings.GraphForbidden],
                ApplicationOwners = applicationOwners,
                DirectoryRoleAssignments = directoryRoleAssignments,
                ApplicationRegistrations = applicationRegistrations,
                GraphAppRoleAssignments = graphAppRoleAssignments,
            };
        }

        EntraAddCredentialGraphPageReadResult servicePrincipalsResult = await ReadServicePrincipalsAsync(
            accessToken.Token,
            maxPaginationRequests,
            cancellationToken).ConfigureAwait(false);

        partial |= servicePrincipalsResult.PartialCollection;
        if (servicePrincipalsResult.Forbidden)
        {
            return new EntraAddCredentialGraphReadResult
            {
                Forbidden = true,
                Warnings = [SecurityEvidenceAddCredentialAdapterWarnings.GraphForbidden],
                ApplicationOwners = applicationOwners,
                DirectoryRoleAssignments = directoryRoleAssignments,
                ApplicationRegistrations = applicationRegistrations,
                GraphAppRoleAssignments = graphAppRoleAssignments,
            };
        }

        Dictionary<string, string> servicePrincipalIdByAppId = BuildServicePrincipalIdByAppId(servicePrincipalsResult.Items);
        applicationRegistrations.AddRange(BuildApplicationRegistrations(applicationsResult.Items, servicePrincipalIdByAppId));

        EntraAddCredentialGraphPageReadResult ownersForbiddenCheck = await ReadApplicationOwnersAsync(
            accessToken.Token,
            applicationsResult.Items,
            maxApplicationOwnerRequests,
            maxPaginationRequests,
            applicationOwners,
            cancellationToken).ConfigureAwait(false);

        partial |= ownersForbiddenCheck.PartialCollection;
        if (ownersForbiddenCheck.Forbidden)
        {
            return new EntraAddCredentialGraphReadResult
            {
                Forbidden = true,
                Warnings = [SecurityEvidenceAddCredentialAdapterWarnings.GraphForbidden],
                ApplicationOwners = applicationOwners,
                DirectoryRoleAssignments = directoryRoleAssignments,
                ApplicationRegistrations = applicationRegistrations,
                GraphAppRoleAssignments = graphAppRoleAssignments,
            };
        }

        EntraAddCredentialGraphPageReadResult directoryRolesResult = await ReadDirectoryRoleAssignmentsAsync(
            accessToken.Token,
            maxPaginationRequests,
            directoryRoleAssignments,
            cancellationToken).ConfigureAwait(false);

        partial |= directoryRolesResult.PartialCollection;
        if (directoryRolesResult.Forbidden)
        {
            return new EntraAddCredentialGraphReadResult
            {
                Forbidden = true,
                Warnings = [SecurityEvidenceAddCredentialAdapterWarnings.GraphForbidden],
                ApplicationOwners = applicationOwners,
                DirectoryRoleAssignments = directoryRoleAssignments,
                ApplicationRegistrations = applicationRegistrations,
                GraphAppRoleAssignments = graphAppRoleAssignments,
            };
        }

        string? graphServicePrincipalId = TryResolveMicrosoftGraphServicePrincipalId(servicePrincipalsResult.Items);

        if (!string.IsNullOrWhiteSpace(graphServicePrincipalId))
        {
            EntraAddCredentialGraphPageReadResult graphRolesResult = await ReadMicrosoftGraphAppRoleAssignmentsAsync(
                accessToken.Token,
                graphServicePrincipalId,
                maxPaginationRequests,
                graphAppRoleAssignments,
                cancellationToken).ConfigureAwait(false);

            partial |= graphRolesResult.PartialCollection;
            if (graphRolesResult.Forbidden)
            {
                return new EntraAddCredentialGraphReadResult
            {
                Forbidden = true,
                Warnings = [SecurityEvidenceAddCredentialAdapterWarnings.GraphForbidden],
                ApplicationOwners = applicationOwners,
                DirectoryRoleAssignments = directoryRoleAssignments,
                ApplicationRegistrations = applicationRegistrations,
                GraphAppRoleAssignments = graphAppRoleAssignments,
            };
            }
        }

        else
        {
            partial = true;
        }

        return new EntraAddCredentialGraphReadResult
        {
            Warnings = partial ? [SecurityEvidenceAddCredentialAdapterWarnings.GraphIncomplete] : [],
            ApplicationOwners = applicationOwners,
            DirectoryRoleAssignments = directoryRoleAssignments,
            ApplicationRegistrations = applicationRegistrations,
            GraphAppRoleAssignments = graphAppRoleAssignments,
        };
    }

    private async Task<EntraAddCredentialGraphPageReadResult> ReadApplicationsAsync(
        string accessToken,
        int maxPaginationRequests,
        CancellationToken cancellationToken)
    {
        bool partial = false;
        List<JsonElement> items = [];
        string? nextLink = "https://graph.microsoft.com/v1.0/applications?$select=id,appId&$top=999";
        int requestCount = 0;
        HashSet<string> visitedLinks = new(StringComparer.Ordinal);

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            requestCount++;

            if (requestCount > maxPaginationRequests || !visitedLinks.Add(nextLink))
            {
                logger.LogWarning(
                    "Entra add-credential Graph read stopped listing applications after {MaxPages} pages.",
                    maxPaginationRequests);

                partial = true;

                break;
            }

            EntraAddCredentialGraphPageReadResult page = await ReadGraphPageAsync(accessToken, nextLink, cancellationToken)
                .ConfigureAwait(false);

            partial |= page.PartialCollection;

            if (page.Forbidden)
            {
                return page;
            }

            items.AddRange(page.Items);
            nextLink = page.NextLink;
        }

        return new EntraAddCredentialGraphPageReadResult { Items = items, PartialCollection = partial };
    }

    private async Task<EntraAddCredentialGraphPageReadResult> ReadServicePrincipalsAsync(
        string accessToken,
        int maxPaginationRequests,
        CancellationToken cancellationToken)
    {
        bool partial = false;
        List<JsonElement> items = [];
        string? nextLink = "https://graph.microsoft.com/v1.0/servicePrincipals?$select=id,appId&$top=999";
        int requestCount = 0;
        HashSet<string> visitedLinks = new(StringComparer.Ordinal);

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            requestCount++;

            if (requestCount > maxPaginationRequests || !visitedLinks.Add(nextLink))
            {
                logger.LogWarning(
                    "Entra add-credential Graph read stopped listing service principals after {MaxPages} pages.",
                    maxPaginationRequests);

                partial = true;

                break;
            }

            EntraAddCredentialGraphPageReadResult page = await ReadGraphPageAsync(accessToken, nextLink, cancellationToken)
                .ConfigureAwait(false);

            partial |= page.PartialCollection;

            if (page.Forbidden)
            {
                return page;
            }

            items.AddRange(page.Items);
            nextLink = page.NextLink;
        }

        return new EntraAddCredentialGraphPageReadResult { Items = items, PartialCollection = partial };
    }

    private async Task<EntraAddCredentialGraphPageReadResult> ReadApplicationOwnersAsync(
        string accessToken,
        IReadOnlyList<JsonElement> applications,
        int maxApplicationOwnerRequests,
        int maxPaginationRequests,
        List<AzureInventoryApplicationOwnerRow> owners,
        CancellationToken cancellationToken)
    {
        bool partial = false;
        int ownerRequestCount = 0;

        foreach (JsonElement application in applications)
        {
            if (maxApplicationOwnerRequests > 0 && ownerRequestCount >= maxApplicationOwnerRequests)
            {
                logger.LogWarning(
                    "Entra add-credential Graph read stopped listing application owners after {MaxOwnerRequests} applications.",
                    maxApplicationOwnerRequests);

                partial = true;

                break;
            }

            string? appObjectId = TryReadString(application, "id");
            string? appId = TryReadString(application, "appId");

            if (string.IsNullOrWhiteSpace(appObjectId) || string.IsNullOrWhiteSpace(appId))
            {
                partial = true;
                continue;
            }

            ownerRequestCount++;
            string ownersUrl =
                $"https://graph.microsoft.com/v1.0/applications/{Uri.EscapeDataString(appObjectId.Trim())}/owners?$select=id";
            string? nextLink = ownersUrl;
            int pageCount = 0;
            HashSet<string> visitedLinks = new(StringComparer.Ordinal);

            while (!string.IsNullOrWhiteSpace(nextLink))
            {
                pageCount++;

                if (pageCount > maxPaginationRequests || !visitedLinks.Add(nextLink))
                {
                    partial = true;
                    break;
                }

                EntraAddCredentialGraphPageReadResult page = await ReadGraphPageAsync(accessToken, nextLink, cancellationToken)
                    .ConfigureAwait(false);

                partial |= page.PartialCollection;

                if (page.Forbidden)
                {
                    return page;
                }

                foreach (JsonElement owner in page.Items)
                {
                    string? ownerId = TryReadString(owner, "id");

                    if (string.IsNullOrWhiteSpace(ownerId))
                    {
                        partial = true;
                        continue;
                    }

                    owners.Add(new AzureInventoryApplicationOwnerRow
                    {
                        AppObjectId = appObjectId.Trim(),
                        AppId = appId.Trim(),
                        OwnerId = ownerId.Trim(),
                        ProvenanceKind = ProvenanceKind.ObservedFact,
                        EvidenceHashSha256 = AzureInventoryApplicationOwnerParser.ComputeDefaultEvidenceHash(
                            appObjectId,
                            appId,
                            ownerId),
                    });
                }

                nextLink = page.NextLink;
            }
        }

        return new EntraAddCredentialGraphPageReadResult { PartialCollection = partial };
    }

    private async Task<EntraAddCredentialGraphPageReadResult> ReadDirectoryRoleAssignmentsAsync(
        string accessToken,
        int maxPaginationRequests,
        List<AzureInventoryDirectoryRoleAssignmentRow> assignments,
        CancellationToken cancellationToken)
    {
        bool partial = false;
        string? nextLink =
            "https://graph.microsoft.com/v1.0/roleManagement/directory/roleAssignments?$expand=roleDefinition($select=id,templateId,displayName)&$top=999";
        int requestCount = 0;
        HashSet<string> visitedLinks = new(StringComparer.Ordinal);

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            requestCount++;

            if (requestCount > maxPaginationRequests || !visitedLinks.Add(nextLink))
            {
                logger.LogWarning(
                    "Entra add-credential Graph read stopped listing directory role assignments after {MaxPages} pages.",
                    maxPaginationRequests);

                partial = true;

                break;
            }

            EntraAddCredentialGraphPageReadResult page = await ReadGraphPageAsync(accessToken, nextLink, cancellationToken)
                .ConfigureAwait(false);

            partial |= page.PartialCollection;

            if (page.Forbidden)
            {
                return page;
            }

            foreach (JsonElement element in page.Items)
            {
                AzureInventoryDirectoryRoleAssignmentRow? row = TryMapDirectoryRoleAssignment(element);

                if (row is not null)
                {
                    assignments.Add(row);
                }
            }

            nextLink = page.NextLink;
        }

        return new EntraAddCredentialGraphPageReadResult { PartialCollection = partial };
    }

    private async Task<EntraAddCredentialGraphPageReadResult> ReadMicrosoftGraphAppRoleAssignmentsAsync(
        string accessToken,
        string graphServicePrincipalId,
        int maxPaginationRequests,
        List<AzureInventoryGraphAppRoleAssignmentRow> assignments,
        CancellationToken cancellationToken)
    {
        bool partial = false;
        string? nextLink =
            $"https://graph.microsoft.com/v1.0/servicePrincipals/{Uri.EscapeDataString(graphServicePrincipalId)}/appRoleAssignedTo?$select=principalId,appRoleId,resourceId&$top=999";
        int requestCount = 0;
        HashSet<string> visitedLinks = new(StringComparer.Ordinal);

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            requestCount++;

            if (requestCount > maxPaginationRequests || !visitedLinks.Add(nextLink))
            {
                partial = true;
                break;
            }

            EntraAddCredentialGraphPageReadResult page = await ReadGraphPageAsync(accessToken, nextLink, cancellationToken)
                .ConfigureAwait(false);

            partial |= page.PartialCollection;

            if (page.Forbidden)
            {
                return page;
            }

            foreach (JsonElement element in page.Items)
            {
                string? principalId = TryReadString(element, "principalId");
                string? appRoleId = TryReadString(element, "appRoleId");
                string? resourceId = TryReadString(element, "resourceId");

                if (string.IsNullOrWhiteSpace(principalId)
                    || string.IsNullOrWhiteSpace(appRoleId)
                    || string.IsNullOrWhiteSpace(resourceId))
                {
                    partial = true;
                    continue;
                }

                if (!AzureInventoryMicrosoftGraphWellKnown.IsCollectedPrivilegePathGraphAppRoleId(appRoleId))
                {
                    continue;
                }

                assignments.Add(new AzureInventoryGraphAppRoleAssignmentRow
                {
                    PrincipalId = principalId.Trim(),
                    AppRoleId = appRoleId.Trim(),
                    ResourceId = resourceId.Trim(),
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                    EvidenceHashSha256 = AzureInventoryGraphAppRoleAssignmentParser.ComputeDefaultEvidenceHash(
                        principalId,
                        resourceId,
                        appRoleId),
                });
            }

            nextLink = page.NextLink;
        }

        return new EntraAddCredentialGraphPageReadResult { PartialCollection = partial };
    }

    private async Task<EntraAddCredentialGraphPageReadResult> ReadGraphPageAsync(
        string accessToken,
        string url,
        CancellationToken cancellationToken)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out Uri? uri)
            || !uri.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)
            || !EntraGroupMembershipGraphTrustedHosts.IsTrusted(uri.Host))
        {
            throw new InvalidOperationException("Entra add-credential Graph read stopped due to an untrusted URL.");
        }

        try
        {
            using HttpRequestMessage request = new(HttpMethod.Get, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            using HttpResponseMessage response =
                await httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            if (response.StatusCode == HttpStatusCode.Forbidden)
                return new EntraAddCredentialGraphPageReadResult { Forbidden = true };

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Entra Graph collection failed with HTTP {StatusCode}.", (int)response.StatusCode);
                return new EntraAddCredentialGraphPageReadResult { PartialCollection = true };
            }

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
            using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
                .ConfigureAwait(false);
            JsonElement root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object
                || !root.TryGetProperty("value", out JsonElement value)
                || value.ValueKind != JsonValueKind.Array)
                return new EntraAddCredentialGraphPageReadResult { PartialCollection = true };

            List<JsonElement> items = [];
            bool partial = false;
            foreach (JsonElement item in value.EnumerateArray())
            {
                if (item.ValueKind != JsonValueKind.Object)
                {
                    partial = true;
                    continue;
                }

                items.Add(item.Clone());
            }

            string? nextLink = null;
            if (root.TryGetProperty("@odata.nextLink", out JsonElement next) && next.ValueKind != JsonValueKind.Null)
            {
                if (next.ValueKind == JsonValueKind.String
                    && Uri.TryCreate(next.GetString(), UriKind.Absolute, out Uri? nextUri)
                    && nextUri.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)
                    && nextUri.Host.Equals(uri.Host, StringComparison.OrdinalIgnoreCase)
                    && nextUri.Port == uri.Port
                    && nextUri.AbsolutePath.Equals(uri.AbsolutePath, StringComparison.OrdinalIgnoreCase)
                    && string.IsNullOrEmpty(nextUri.UserInfo))
                    nextLink = next.GetString();
                else
                    partial = true;
            }

            return new EntraAddCredentialGraphPageReadResult
            {
                Items = items,
                NextLink = nextLink,
                PartialCollection = partial,
            };
        }
        catch (Exception exception) when (exception is HttpRequestException or IOException or JsonException
            || (exception is OperationCanceledException && !cancellationToken.IsCancellationRequested))
        {
            logger.LogWarning("Entra Graph collection was interrupted ({FailureType}).", exception.GetType().Name);
            return new EntraAddCredentialGraphPageReadResult { PartialCollection = true };
        }
    }

    private static Dictionary<string, string> BuildServicePrincipalIdByAppId(IReadOnlyList<JsonElement> servicePrincipals)
    {
        Dictionary<string, string> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonElement servicePrincipal in servicePrincipals)
        {
            string? appId = TryReadString(servicePrincipal, "appId");
            string? objectId = TryReadString(servicePrincipal, "id");

            if (string.IsNullOrWhiteSpace(appId) || string.IsNullOrWhiteSpace(objectId))
            {
                continue;
            }

            map.TryAdd(appId.Trim(), objectId.Trim());
        }

        return map;
    }

    private static List<AzureInventoryEntraApplicationRegistrationRow> BuildApplicationRegistrations(
        IReadOnlyList<JsonElement> applications,
        IReadOnlyDictionary<string, string> servicePrincipalIdByAppId)
    {
        List<AzureInventoryEntraApplicationRegistrationRow> registrations = [];

        foreach (JsonElement application in applications)
        {
            string? appObjectId = TryReadString(application, "id");
            string? appId = TryReadString(application, "appId");

            if (string.IsNullOrWhiteSpace(appObjectId)
                || string.IsNullOrWhiteSpace(appId)
                || !servicePrincipalIdByAppId.TryGetValue(appId.Trim(), out string? servicePrincipalObjectId))
            {
                continue;
            }

            registrations.Add(new AzureInventoryEntraApplicationRegistrationRow
            {
                AppObjectId = appObjectId.Trim(),
                AppId = appId.Trim(),
                ServicePrincipalObjectId = servicePrincipalObjectId,
            });
        }

        return registrations;
    }

    private static string? TryResolveMicrosoftGraphServicePrincipalId(IReadOnlyList<JsonElement> servicePrincipals)
    {
        foreach (JsonElement servicePrincipal in servicePrincipals)
        {
            string? appId = TryReadString(servicePrincipal, "appId");
            string? objectId = TryReadString(servicePrincipal, "id");

            if (string.IsNullOrWhiteSpace(appId) || string.IsNullOrWhiteSpace(objectId))
            {
                continue;
            }

            if (appId.Equals(AzureInventoryMicrosoftGraphWellKnown.ServicePrincipalAppId, StringComparison.OrdinalIgnoreCase))
            {
                return objectId.Trim();
            }
        }

        return null;
    }

    private static AzureInventoryDirectoryRoleAssignmentRow? TryMapDirectoryRoleAssignment(JsonElement element)
    {
        string? principalId = TryReadString(element, "principalId");
        string? roleDefinitionId = TryReadString(element, "roleDefinitionId");
        string? directoryScopeId = TryReadString(element, "directoryScopeId");

        if (string.IsNullOrWhiteSpace(principalId)
            || string.IsNullOrWhiteSpace(roleDefinitionId)
            || string.IsNullOrWhiteSpace(directoryScopeId))
        {
            return null;
        }

        string? assignmentType = TryReadString(element, "assignmentType");

        if (IsEligibleDirectoryRoleAssignment(assignmentType))
        {
            return null;
        }

        string? templateId = null;
        string? roleName = null;

        if (element.TryGetProperty("roleDefinition", out JsonElement roleDefinition)
            && roleDefinition.ValueKind == JsonValueKind.Object)
        {
            templateId = TryReadString(roleDefinition, "templateId");
            roleName = TryReadString(roleDefinition, "displayName");
        }

        return new AzureInventoryDirectoryRoleAssignmentRow
        {
            PrincipalId = principalId.Trim(),
            RoleDefinitionId = roleDefinitionId.Trim(),
            RoleDefinitionTemplateId = templateId?.Trim(),
            DirectoryScopeId = directoryScopeId.Trim(),
            RoleName = roleName?.Trim(),
            ProvenanceKind = ProvenanceKind.ObservedFact,
            EvidenceHashSha256 = AzureInventoryDirectoryRoleAssignmentParser.ComputeDefaultEvidenceHash(
                principalId,
                roleDefinitionId,
                directoryScopeId),
        };
    }

    private static bool IsEligibleDirectoryRoleAssignment(string? assignmentType)
    {
        if (string.IsNullOrWhiteSpace(assignmentType))
        {
            return false;
        }

        return assignmentType.Equals("Eligible", StringComparison.OrdinalIgnoreCase);
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    }
}
