using System.Net;
using System.Text;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Integrations.AzureExtractor;

using Azure.Core;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;
using Moq.Protected;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
public sealed class EntraAddCredentialGraphReaderTests
{
    private const string AppObjectId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    private const string AppId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    private const string ServicePrincipalId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    private const string OwnerId = "dddddddd-dddd-dddd-dddd-dddddddddddd";

    [Fact]
    public async Task TryReadSnapshotAsync_forbidden_on_applications_returns_warning()
    {
        HttpClient httpClient = CreateHttpClient(_ => new HttpResponseMessage(HttpStatusCode.Forbidden));
        EntraAddCredentialGraphReader sut = new(httpClient, NullLogger<EntraAddCredentialGraphReader>.Instance);

        EntraAddCredentialGraphReadResult result = await sut.TryReadSnapshotAsync(
            new StubTokenCredential(),
            maxPaginationRequests: 8,
            maxApplicationOwnerRequests: 8,
            CancellationToken.None);

        Assert.True(result.Forbidden);
        Assert.Contains(SecurityEvidenceAddCredentialAdapterWarnings.GraphForbidden, result.Warnings);
    }

    [Fact]
    public async Task TryReadSnapshotAsync_retains_all_privilege_path_graph_app_role_ids()
    {
        const string grantorPrincipalId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

        HttpClient httpClient = CreateHttpClient(request =>
        {
            string path = request.RequestUri!.AbsolutePath;

            if (path.Equals("/v1.0/applications", StringComparison.OrdinalIgnoreCase))
            {
                return JsonResponse("""{ "value": [] }""");
            }

            if (path.Contains("/roleManagement/directory/roleAssignments", StringComparison.OrdinalIgnoreCase))
            {
                return JsonResponse("""{ "value": [] }""");
            }

            if (path.Equals("/v1.0/servicePrincipals", StringComparison.OrdinalIgnoreCase))
            {
                return JsonResponse(
                    $$"""
                    {
                      "value": [
                        {
                          "id": "graph-sp-id",
                          "appId": "{{AzureInventoryMicrosoftGraphWellKnown.ServicePrincipalAppId}}"
                        }
                      ]
                    }
                    """);
            }

            if (path.Contains("/appRoleAssignedTo", StringComparison.OrdinalIgnoreCase))
            {
                return JsonResponse(
                    $$"""
                    {
                      "value": [
                        {
                          "principalId": "{{grantorPrincipalId}}",
                          "appRoleId": "{{AzureInventoryMicrosoftGraphWellKnown.ApplicationReadWriteAllAppRoleId}}",
                          "resourceId": "graph-sp-id"
                        },
                        {
                          "principalId": "{{grantorPrincipalId}}",
                          "appRoleId": "{{AzureInventoryMicrosoftGraphWellKnown.RoleManagementReadWriteDirectoryAppRoleId}}",
                          "resourceId": "graph-sp-id"
                        },
                        {
                          "principalId": "{{grantorPrincipalId}}",
                          "appRoleId": "{{AzureInventoryMicrosoftGraphWellKnown.AppRoleAssignmentReadWriteAllAppRoleId}}",
                          "resourceId": "graph-sp-id"
                        },
                        {
                          "principalId": "{{grantorPrincipalId}}",
                          "appRoleId": "00000000-0000-0000-0000-000000000099",
                          "resourceId": "graph-sp-id"
                        }
                      ]
                    }
                    """);
            }

            return new HttpResponseMessage(HttpStatusCode.NotFound);
        });

        EntraAddCredentialGraphReader sut = new(httpClient, NullLogger<EntraAddCredentialGraphReader>.Instance);

        EntraAddCredentialGraphReadResult result = await sut.TryReadSnapshotAsync(
            new StubTokenCredential(),
            maxPaginationRequests: 8,
            maxApplicationOwnerRequests: 8,
            CancellationToken.None);

        Assert.Equal(3, result.GraphAppRoleAssignments.Count);
        Assert.Contains(
            result.GraphAppRoleAssignments,
            row => row.AppRoleId.Equals(
                AzureInventoryMicrosoftGraphWellKnown.RoleManagementReadWriteDirectoryAppRoleId,
                StringComparison.OrdinalIgnoreCase));
        Assert.Contains(
            result.GraphAppRoleAssignments,
            row => row.AppRoleId.Equals(
                AzureInventoryMicrosoftGraphWellKnown.AppRoleAssignmentReadWriteAllAppRoleId,
                StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task TryReadSnapshotAsync_collects_owner_registration_and_directory_role()
    {
        HttpClient httpClient = CreateHttpClient(request =>
        {
            string path = request.RequestUri!.AbsolutePath;

            if (path.Equals("/v1.0/applications", StringComparison.OrdinalIgnoreCase))
            {
                return JsonResponse(
                    $$"""
                    {
                      "value": [
                        { "id": "{{AppObjectId}}", "appId": "{{AppId}}" }
                      ]
                    }
                    """);
            }

            if (path.Contains("/owners", StringComparison.OrdinalIgnoreCase))
            {
                return JsonResponse(
                    $$"""
                    {
                      "value": [
                        { "id": "{{OwnerId}}" }
                      ]
                    }
                    """);
            }

            if (path.Contains("/roleManagement/directory/roleAssignments", StringComparison.OrdinalIgnoreCase))
            {
                return JsonResponse(
                    $$"""
                    {
                      "value": [
                        {
                          "principalId": "{{OwnerId}}",
                          "roleDefinitionId": "role-def-1",
                          "directoryScopeId": "/",
                          "assignmentType": "Assigned",
                          "roleDefinition": {
                            "templateId": "{{AzureInventoryAddCredentialDirectoryRoleTemplates.CloudApplicationAdministrator}}",
                            "displayName": "Cloud Application Administrator"
                          }
                        }
                      ]
                    }
                    """);
            }

            if (path.Equals("/v1.0/servicePrincipals", StringComparison.OrdinalIgnoreCase))
            {
                return JsonResponse(
                    $$"""
                    {
                      "value": [
                        {
                          "id": "{{ServicePrincipalId}}",
                          "appId": "{{AppId}}"
                        },
                        {
                          "id": "graph-sp-id",
                          "appId": "{{AzureInventoryMicrosoftGraphWellKnown.ServicePrincipalAppId}}"
                        }
                      ]
                    }
                    """);
            }

            if (path.Contains("/appRoleAssignedTo", StringComparison.OrdinalIgnoreCase))
            {
                return JsonResponse("""{ "value": [] }""");
            }

            return new HttpResponseMessage(HttpStatusCode.NotFound);
        });

        EntraAddCredentialGraphReader sut = new(httpClient, NullLogger<EntraAddCredentialGraphReader>.Instance);

        EntraAddCredentialGraphReadResult result = await sut.TryReadSnapshotAsync(
            new StubTokenCredential(),
            maxPaginationRequests: 8,
            maxApplicationOwnerRequests: 8,
            CancellationToken.None);

        Assert.False(result.Forbidden);
        Assert.Single(result.ApplicationOwners);
        Assert.Equal(OwnerId, result.ApplicationOwners[0].OwnerId);
        Assert.Single(result.ApplicationRegistrations);
        Assert.Equal(ServicePrincipalId, result.ApplicationRegistrations[0].ServicePrincipalObjectId);
        Assert.Single(result.DirectoryRoleAssignments);
    }

    private static HttpClient CreateHttpClient(Func<HttpRequestMessage, HttpResponseMessage> responder)
    {
        Mock<HttpMessageHandler> handler = new();
        handler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync((HttpRequestMessage request, CancellationToken _) => responder(request));

        return new HttpClient(handler.Object)
        {
            BaseAddress = new Uri("https://graph.microsoft.com/"),
        };
    }

    private static HttpResponseMessage JsonResponse(string json) =>
        new(HttpStatusCode.OK)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json"),
        };

    private sealed class StubTokenCredential : TokenCredential
    {
        public override AccessToken GetToken(TokenRequestContext requestContext, CancellationToken cancellationToken) =>
            new("stub-token", DateTimeOffset.UtcNow.AddHours(1));

        public override ValueTask<AccessToken> GetTokenAsync(
            TokenRequestContext requestContext,
            CancellationToken cancellationToken) =>
            new(GetToken(requestContext, cancellationToken));
    }
}
