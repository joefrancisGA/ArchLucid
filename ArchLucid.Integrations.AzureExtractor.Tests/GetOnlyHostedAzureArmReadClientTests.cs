using System.Net;
using System.Text;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;
[Trait("Category", "Unit")]

public sealed class GetOnlyHostedAzureArmReadClientTests
{
    [Fact]
    public async Task ListSubscriptionResourcesAsync_uses_get_only_against_management_azure_com()
    {
        List<string> methods = [];

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                methods.Add(request.Method.Method);

                Assert.StartsWith("https://management.azure.com/", request.RequestUri?.AbsoluteUri);
                Assert.Equal("Bearer", request.Headers.Authorization?.Scheme);
                Assert.Equal("token-abc", request.Headers.Authorization?.Parameter);

                const string body = """
                                    {
                                      "value": [
                                        {
                                          "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                                          "name": "sa1",
                                          "type": "Microsoft.Storage/storageAccounts",
                                          "location": "eastus",
                                          "properties": { "provisioningState": "Succeeded" }
                                        }
                                      ]
                                    }
                                    """;

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(body)
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmResourceRecord> resources = await client.ListSubscriptionResourcesAsync(
            "token-abc",
            "11111111-1111-1111-1111-111111111111",
            CancellationToken.None);

        Assert.All(methods, method => Assert.Equal(HttpMethod.Get.Method, method));
        Assert.Single(resources);
        Assert.Equal("Microsoft.Storage/storageAccounts", resources[0].ResourceType);
    }

    [Fact]
    public async Task ListSubscriptionResourcesAsync_retains_resources_when_next_link_repeats()
    {
        const string repeatingNextLink =
            "https://management.azure.com/subscriptions/11111111-1111-1111-1111-111111111111/resources?api-version=2021-04-01&$skiptoken=repeat";

        string body = """
                      {
                        "value": [
                          {
                            "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                            "name": "sa1",
                            "type": "Microsoft.Storage/storageAccounts",
                            "location": "eastus"
                          }
                        ],
                        "nextLink": "REPEATING_LINK"
                      }
                      """.Replace("REPEATING_LINK", repeatingNextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current > 3)
                {
                    throw new InvalidOperationException(
                        "Test hang guard: ARM resource listing did not stop on repeating nextLink.");
                }

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(body)
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmResourceRecord> resources = await client.ListSubscriptionResourcesAsync(
            "token-abc",
            "11111111-1111-1111-1111-111111111111",
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.NotEmpty(resources);
        Assert.Equal("sa1", resources[0].Name);
    }

    [Fact]
    public async Task ListSubscriptionResourcesAsync_retains_resources_when_later_page_fails()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string nextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/resources?api-version=2021-04-01&$skiptoken=page2";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                                     "name": "sa1",
                                     "type": "Microsoft.Storage/storageAccounts",
                                     "location": "eastus"
                                   }
                                 ],
                                 "nextLink": "PAGE_TWO_LINK"
                               }
                               """.Replace("PAGE_TWO_LINK", nextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmResourceRecord> resources = await client.ListSubscriptionResourcesAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.Single(resources);
        Assert.Equal("sa1", resources[0].Name);
    }

    [Fact]
    public async Task ListSubscriptionResourcesAsync_retains_resources_when_later_page_body_is_invalid_json()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string nextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/resources?api-version=2021-04-01&$skiptoken=page2";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                                     "name": "sa1",
                                     "type": "Microsoft.Storage/storageAccounts",
                                     "location": "eastus"
                                   }
                                 ],
                                 "nextLink": "PAGE_TWO_LINK"
                               }
                               """.Replace("PAGE_TWO_LINK", nextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent("{ not-json")
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmResourceRecord> resources = await client.ListSubscriptionResourcesAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.Single(resources);
        Assert.Equal("sa1", resources[0].Name);
    }

    [Fact]
    public async Task ListSubscriptionResourcesAsync_retains_resources_when_max_pagination_limit_reached()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int page = Interlocked.Increment(ref requestCount);
                string? nextLink = page < 64
                    ? $"https://management.azure.com/subscriptions/{subscriptionId}/resources?api-version=2021-04-01&$skiptoken=page-{page}"
                    : null;

                string nextLinkJson = nextLink is null ? "null" : $"\"{nextLink}\"";

                string body = $$"""
                                  {
                                    "value": [
                                      {
                                        "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa{{page}}",
                                        "name": "sa{{page}}",
                                        "type": "Microsoft.Storage/storageAccounts",
                                        "location": "eastus"
                                      }
                                    ],
                                    "nextLink": {{nextLinkJson}}
                                  }
                                  """;

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(body)
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmResourceRecord> resources = await client.ListSubscriptionResourcesAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(64, requestCount);
        Assert.Equal(64, resources.Count);
        Assert.Equal("sa1", resources[0].Name);
        Assert.Equal("sa64", resources[63].Name);
    }

    [Fact]
    public async Task ListSubscriptionResourcesAsync_preserves_null_arm_tag_values_as_empty_strings()
    {
        HttpMessageHandler handler = new RecordingHandler(
            (_, _) => Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""
                                                {
                                                  "value": [
                                                    {
                                                      "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                                                      "name": "sa1",
                                                      "type": "Microsoft.Storage/storageAccounts",
                                                      "location": "eastus",
                                                      "tags": {
                                                        "env": "prod",
                                                        "owner": null
                                                      }
                                                    }
                                                  ]
                                                }
                                                """)
                }));

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmResourceRecord> resources = await client.ListSubscriptionResourcesAsync(
            "token-abc",
            "11111111-1111-1111-1111-111111111111",
            CancellationToken.None);

        Assert.Single(resources);
        Assert.NotNull(resources[0].Tags);
        Assert.Equal("prod", resources[0].Tags!["env"]);
        Assert.Equal(string.Empty, resources[0].Tags!["owner"]);
    }

    [Fact]
    public async Task ListSubscriptionRoleAssignmentsAsync_maps_assignment_properties()
    {
        HttpMessageHandler handler = new RecordingHandler(
            (_, _) => Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""
                                                {
                                                  "value": [
                                                    {
                                                      "properties": {
                                                        "scope": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                                                        "principalId": "11111111-1111-1111-1111-111111111111",
                                                        "principalType": "Group",
                                                        "roleDefinitionId": "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"
                                                      }
                                                    }
                                                  ]
                                                }
                                                """)
                }));

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> assignments =
            await client.ListSubscriptionRoleAssignmentsAsync(
                "token-abc",
                "11111111-1111-1111-1111-111111111111",
                CancellationToken.None);

        Assert.Single(assignments);
        Assert.Equal("Group", assignments[0].PrincipalType);
        Assert.Equal("11111111-1111-1111-1111-111111111111", assignments[0].PrincipalId);
        Assert.Equal("standing", assignments[0].PimEligibilityKind);
    }

    [Fact]
    public async Task ListSubscriptionRoleAssignmentsAsync_retains_assignments_when_later_page_fails()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string nextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Authorization/roleAssignments?api-version=2022-04-01&$skiptoken=page2";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "properties": {
                                       "scope": "/subscriptions/11111111-1111-1111-1111-111111111111",
                                       "principalId": "11111111-1111-1111-1111-111111111111",
                                       "principalType": "Group",
                                       "roleDefinitionId": "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"
                                     }
                                   }
                                 ],
                                 "nextLink": "PAGE_TWO_LINK"
                               }
                               """.Replace("PAGE_TWO_LINK", nextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> assignments =
            await client.ListSubscriptionRoleAssignmentsAsync(
                "token-abc",
                subscriptionId,
                CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.Single(assignments);
        Assert.Equal("11111111-1111-1111-1111-111111111111", assignments[0].PrincipalId);
    }

    [Fact]
    public async Task ListSubscriptionRoleAssignmentsAsync_rejects_next_link_for_different_role_listing_path()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string crossListingNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Authorization/roleEligibilitySchedules?api-version=2020-10-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "properties": {
                                       "scope": "/subscriptions/11111111-1111-1111-1111-111111111111",
                                       "principalId": "22222222-2222-2222-2222-222222222222",
                                       "principalType": "User",
                                       "roleDefinitionId": "/subscriptions/11111111-1111-1111-1111-111111111111/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"
                                     }
                                   }
                                 ],
                                 "nextLink": "CROSS_LISTING_LINK"
                               }
                               """.Replace("CROSS_LISTING_LINK", crossListingNextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: role assignment listing did not stop on cross-listing nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListSubscriptionRoleAssignmentsAsync(
                "token-abc",
                subscriptionId,
                CancellationToken.None));

        Assert.Contains("resource scope", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListFederatedCredentialsAsync_maps_user_assigned_identity_credentials()
    {
        const string identityResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/uami1";

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                Assert.Contains("federatedIdentityCredentials", request.RequestUri?.AbsoluteUri, StringComparison.Ordinal);

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent("""
                                                    {
                                                      "value": [
                                                        {
                                                          "name": "github-main",
                                                          "properties": {
                                                            "issuer": "https://token.actions.githubusercontent.com",
                                                            "subject": "repo:org/repo:ref:refs/heads/main"
                                                          }
                                                        }
                                                      ]
                                                    }
                                                    """)
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmResourceRecord> resources =
        [
            new HostedAzureArmResourceRecord(
                "Microsoft.ManagedIdentity/userAssignedIdentities",
                identityResourceId,
                "uami1",
                "eastus",
                null,
                null,
                new Dictionary<string, object?>
                {
                    ["principalId"] = "11111111-1111-1111-1111-111111111111",
                    ["clientId"] = "22222222-2222-2222-2222-222222222222",
                }),
        ];

        IReadOnlyList<HostedAzureArmFederatedCredentialRecord> credentials =
            await client.ListFederatedCredentialsAsync("token-abc", resources, CancellationToken.None);

        Assert.Single(credentials);
        Assert.Equal("https://token.actions.githubusercontent.com", credentials[0].Issuer);
        Assert.Equal("repo:org/repo:ref:refs/heads/main", credentials[0].Subject);
        Assert.Equal("11111111-1111-1111-1111-111111111111", credentials[0].PrincipalId);
        Assert.Equal("22222222-2222-2222-2222-222222222222", credentials[0].AppId);
        Assert.Equal(identityResourceId, credentials[0].ParentResourceId);
        Assert.Equal("github-main", credentials[0].CredentialName);
    }

    [Fact]
    public async Task ListFederatedCredentialsAsync_rejects_next_link_for_different_identity_resource_id()
    {
        const string identityResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/uami1";
        const string otherIdentityResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/uami2";
        const string crossIdentityNextLink =
            $"https://management.azure.com{otherIdentityResourceId}/federatedIdentityCredentials?api-version=2023-01-31&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "cred-page-one",
                                     "properties": {
                                       "issuer": "https://token.actions.githubusercontent.com",
                                       "subject": "repo:org/repo:ref:refs/heads/main"
                                     }
                                   }
                                 ],
                                 "nextLink": "CROSS_IDENTITY_LINK"
                               }
                               """.Replace("CROSS_IDENTITY_LINK", crossIdentityNextLink, StringComparison.Ordinal);

        string secondPageBody = """
                                {
                                  "value": [
                                    {
                                      "name": "cred-leaked",
                                      "properties": {
                                        "issuer": "https://evil.example",
                                        "subject": "repo:evil/evil:ref:refs/heads/main"
                                      }
                                    }
                                  ]
                                }
                                """;

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                if (current == 2)
                {
                    Assert.Equal(crossIdentityNextLink, request.RequestUri?.AbsoluteUri);

                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(secondPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: federated credential listing did not stop on cross-identity nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListFederatedCredentialsAsync(
                "token-abc",
                [
                    new HostedAzureArmResourceRecord(
                        "Microsoft.ManagedIdentity/userAssignedIdentities",
                        identityResourceId,
                        "uami1",
                        "eastus",
                        null,
                        null,
                        new Dictionary<string, object?>
                        {
                            ["principalId"] = "11111111-1111-1111-1111-111111111111",
                        }),
                ],
                CancellationToken.None));

        Assert.Contains("identity", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListFederatedCredentialsAsync_rejects_next_link_with_federated_credentials_prefix_collision()
    {
        const string identityResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/uami1";
        string prefixCollisionNextLink =
            $"https://management.azure.com{identityResourceId}/federatedIdentityCredentialsEvil?api-version=2023-01-31";
        string firstPageBody = """
                               {
                                 "value": [],
                                 "nextLink": "PREFIX_COLLISION_LINK"
                               }
                               """.Replace("PREFIX_COLLISION_LINK", prefixCollisionNextLink, StringComparison.Ordinal);

        int requestCount = 0;
        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                Interlocked.Increment(ref requestCount);

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(firstPageBody)
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListFederatedCredentialsAsync(
                "token-abc",
                [
                    new HostedAzureArmResourceRecord(
                        "Microsoft.ManagedIdentity/userAssignedIdentities",
                        identityResourceId,
                        "uami1",
                        "eastus",
                        null,
                        null,
                        new Dictionary<string, object?>
                        {
                            ["principalId"] = "11111111-1111-1111-1111-111111111111",
                        }),
                ],
                CancellationToken.None));

        Assert.Contains("identity", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListFactoryLinkedServicesAsync_retains_linked_services_when_later_page_returns_forbidden()
    {
        const string factoryResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-a";
        const string nextLink =
            $"https://management.azure.com{factoryResourceId}/linkedservices?api-version=2018-06-01&$skiptoken=page2";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "BlobLS-a",
                                     "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-a/linkedservices/BlobLS-a"
                                   }
                                 ],
                                 "nextLink": "ADF_LINKED_SERVICES_NEXT_LINK"
                               }
                               """.Replace("ADF_LINKED_SERVICES_NEXT_LINK", nextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.Forbidden));
            });

        GetOnlyHostedAzureArmReadClient client = new(
            new HttpClient(handler),
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        var linkedServices = await client.ListFactoryLinkedServicesAsync(
            "token-abc",
            factoryResourceId,
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.Single(linkedServices);
    }

    [Fact]
    public async Task ListFactoryLinkedServicesAsync_rejects_next_link_for_different_factory_child_collection()
    {
        const string factoryResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-a";
        const string crossCollectionNextLink =
            $"https://management.azure.com{factoryResourceId}/pipelines?api-version=2018-06-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "BlobLS-a",
                                     "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-a/linkedservices/BlobLS-a"
                                   }
                                 ],
                                 "nextLink": "CROSS_COLLECTION_LINK"
                               }
                               """.Replace("CROSS_COLLECTION_LINK", crossCollectionNextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: ADF linked-service listing did not stop on cross-collection nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListFactoryLinkedServicesAsync(
                "token-abc",
                factoryResourceId,
                CancellationToken.None));

        Assert.Contains("resource scope", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListFactoryLinkedServicesAsync_rejects_next_link_for_different_factory_resource_id()
    {
        const string factoryResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-a";
        const string otherFactoryResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-b";
        const string crossFactoryNextLink =
            $"https://management.azure.com{otherFactoryResourceId}/linkedservices?api-version=2018-06-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "BlobLS-a",
                                     "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-a/linkedservices/BlobLS-a"
                                   }
                                 ],
                                 "nextLink": "CROSS_FACTORY_LINK"
                               }
                               """.Replace("CROSS_FACTORY_LINK", crossFactoryNextLink, StringComparison.Ordinal);

        string secondPageBody = """
                                {
                                  "value": [
                                    {
                                      "name": "BlobLS-b",
                                      "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-b/linkedservices/BlobLS-b"
                                    }
                                  ]
                                }
                                """;

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                if (current == 2)
                {
                    Assert.Equal(crossFactoryNextLink, request.RequestUri?.AbsoluteUri);

                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(secondPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: ADF linked-service listing did not stop on cross-factory nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListFactoryLinkedServicesAsync(
                "token-abc",
                factoryResourceId,
                CancellationToken.None));

        Assert.Contains("resource scope", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListVaultBackupProtectedItemsAsync_retains_items_when_later_page_fails()
    {
        const string vaultResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.RecoveryServices/vaults/vault-a";
        const string nextLink =
            $"https://management.azure.com{vaultResourceId}/backupProtectedItems?api-version=2023-04-01&$skiptoken=page2";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "item-a",
                                     "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.RecoveryServices/vaults/vault-a/backupProtectedItems/item-a"
                                   }
                                 ],
                                 "nextLink": "VAULT_BACKUP_NEXT_LINK"
                               }
                               """.Replace("VAULT_BACKUP_NEXT_LINK", nextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
            });

        GetOnlyHostedAzureArmReadClient client = new(
            new HttpClient(handler),
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureVaultProtectedItemListResult result = await client.ListVaultBackupProtectedItemsAsync(
            "token-abc",
            vaultResourceId,
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.True(result.Succeeded);
        Assert.Single(result.Items);
    }

    [Fact]
    public async Task ListChildResourcesWithStatusAsync_retains_children_and_marks_partial_when_later_page_fails()
    {
        const string staticSiteId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/staticSites/swa1";
        const string nextLink =
            $"https://management.azure.com{staticSiteId}/linkedBackends?api-version=2023-12-01&$skiptoken=page2";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "be1",
                                     "properties": {
                                       "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/api1"
                                     }
                                   }
                                 ],
                                 "nextLink": "STATIC_SITE_NEXT_LINK"
                               }
                               """.Replace("STATIC_SITE_NEXT_LINK", nextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current <= 2)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
            });

        GetOnlyHostedAzureArmReadClient client = new(
            new HttpClient(handler),
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureArmChildCollectionReadResult result = await client.ListChildResourcesWithStatusAsync(
            "token-abc",
            staticSiteId,
            "linkedBackends",
            "2023-12-01",
            CancellationToken.None);

        Assert.Equal(3, requestCount);
        Assert.Equal(200, result.StatusCode);
        Assert.True(result.PartialCollection);
        Assert.Single(result.Values);
    }

    [Fact]
    public async Task ListVaultBackupProtectedItemsAsync_rejects_next_link_for_different_vault_resource_id()
    {
        const string vaultResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.RecoveryServices/vaults/vault-a";
        const string otherVaultResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.RecoveryServices/vaults/vault-b";
        const string crossVaultNextLink =
            $"https://management.azure.com{otherVaultResourceId}/backupProtectedItems?api-version=2023-04-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "item-a",
                                     "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.RecoveryServices/vaults/vault-a/backupProtectedItems/item-a"
                                   }
                                 ],
                                 "nextLink": "CROSS_VAULT_LINK"
                               }
                               """.Replace("CROSS_VAULT_LINK", crossVaultNextLink, StringComparison.Ordinal);

        string secondPageBody = """
                                {
                                  "value": [
                                    {
                                      "name": "item-b",
                                      "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.RecoveryServices/vaults/vault-b/backupProtectedItems/item-b"
                                    }
                                  ]
                                }
                                """;

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                if (current == 2)
                {
                    Assert.Equal(crossVaultNextLink, request.RequestUri?.AbsoluteUri);

                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(secondPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: vault protected-item listing did not stop on cross-vault nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListVaultBackupProtectedItemsAsync(
                "token-abc",
                vaultResourceId,
                CancellationToken.None));

        Assert.Contains("resource scope", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListChildJsonElementsAsync_marks_partial_when_later_page_fails()
    {
        const string serverResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1";
        const string nextLink =
            $"https://management.azure.com{serverResourceId}/databases?api-version=2021-11-01&$skiptoken=page2";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "db1",
                                     "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1/databases/db1"
                                   }
                                 ],
                                 "nextLink": "SQL_DB_NEXT_LINK"
                               }
                               """.Replace("SQL_DB_NEXT_LINK", nextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current <= 2)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
            });

        GetOnlyHostedAzureArmReadClient client = new(
            new HttpClient(handler),
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureArmChildCollectionReadResult result = await client.ListChildJsonElementsAsync(
            "token-abc",
            serverResourceId,
            "databases",
            "2021-11-01",
            "SQL database",
            CancellationToken.None);

        Assert.Equal(3, requestCount);
        Assert.Equal(200, result.StatusCode);
        Assert.True(result.PartialCollection);
        Assert.Single(result.Values);
    }

    [Fact]
    public async Task ListChildJsonElementsAsync_rejects_next_link_for_different_parent_resource_id()
    {
        const string parentResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-a";
        const string otherParentResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-b";
        const string crossParentNextLink =
            $"https://management.azure.com{otherParentResourceId}/databases?api-version=2021-11-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "db-a",
                                     "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql-a/databases/db-a"
                                   }
                                 ],
                                 "nextLink": "CROSS_PARENT_LINK"
                               }
                               """.Replace("CROSS_PARENT_LINK", crossParentNextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current <= 2)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: child-resource listing did not stop on cross-parent nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListChildJsonElementsAsync(
                "token-abc",
                parentResourceId,
                "databases",
                "2021-11-01",
                "SQL databases",
                CancellationToken.None));

        Assert.Contains("resource scope", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(2, requestCount);
    }

    [Fact]
    public async Task ListBuiltInPolicyDefinitionDocumentsAsync_rejects_next_link_for_different_policy_collection()
    {
        const string crossScopeNextLink =
            "https://management.azure.com/subscriptions/11111111-1111-1111-1111-111111111111/providers/Microsoft.Authorization/policyDefinitions?api-version=2021-06-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "builtin-audit",
                                     "id": "/providers/Microsoft.Authorization/policyDefinitions/builtin-audit"
                                   }
                                 ],
                                 "nextLink": "CROSS_SCOPE_LINK"
                               }
                               """.Replace("CROSS_SCOPE_LINK", crossScopeNextLink, StringComparison.Ordinal);

        string secondPageBody = """
                                {
                                  "value": [
                                    {
                                      "name": "sub-leak",
                                      "id": "/subscriptions/11111111-1111-1111-1111-111111111111/providers/Microsoft.Authorization/policyDefinitions/sub-leak"
                                    }
                                  ]
                                }
                                """;

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                if (current == 2)
                {
                    Assert.Equal(crossScopeNextLink, request.RequestUri?.AbsoluteUri);

                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(secondPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: built-in policy definition listing did not stop on cross-collection nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListBuiltInPolicyDefinitionDocumentsAsync(
                "token-abc",
                CancellationToken.None));

        Assert.Contains("policy definition", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListSubscriptionResourcesAsync_rejects_next_link_for_different_subscription_listing_path()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string crossListingNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Authorization/roleAssignments?api-version=2022-04-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1",
                                     "name": "vnet1",
                                     "type": "Microsoft.Network/virtualNetworks",
                                     "location": "eastus"
                                   }
                                 ],
                                 "nextLink": "CROSS_LISTING_LINK"
                               }
                               """.Replace("CROSS_LISTING_LINK", crossListingNextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: subscription resource listing did not stop on cross-listing nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListSubscriptionResourcesAsync(
                "token-abc",
                subscriptionId,
                CancellationToken.None));

        Assert.Contains("resource scope", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListSubscriptionResourcesAsync_rejects_next_link_on_untrusted_host()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string untrustedHostNextLink =
            $"https://evil.example.com/subscriptions/{subscriptionId}/resources?api-version=2021-04-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1",
                                     "name": "vnet1",
                                     "type": "Microsoft.Network/virtualNetworks",
                                     "location": "eastus"
                                   }
                                 ],
                                 "nextLink": "UNTRUSTED_HOST_LINK"
                               }
                               """.Replace("UNTRUSTED_HOST_LINK", untrustedHostNextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: subscription resource listing did not stop on untrusted-host nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListSubscriptionResourcesAsync(
                "token-abc",
                subscriptionId,
                CancellationToken.None));

        Assert.Contains("untrusted host", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListSubscriptionPolicyDefinitionDocumentsAsync_rejects_next_link_for_different_policy_collection()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string crossCollectionNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Authorization/policyAssignments?api-version=2022-06-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "def-audit",
                                     "id": "/subscriptions/11111111-1111-1111-1111-111111111111/providers/Microsoft.Authorization/policyDefinitions/def-audit"
                                   }
                                 ],
                                 "nextLink": "CROSS_COLLECTION_LINK"
                               }
                               """.Replace("CROSS_COLLECTION_LINK", crossCollectionNextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: subscription policy definition listing did not stop on cross-collection nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListSubscriptionPolicyDefinitionDocumentsAsync(
                "token-abc",
                subscriptionId,
                CancellationToken.None));

        Assert.Contains("resource scope", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListSubscriptionResourcesByTypeAsync_rejects_next_link_for_different_type_listing_path()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string crossListingNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/resources?api-version=2021-04-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe1",
                                     "name": "pe1",
                                     "type": "Microsoft.Network/privateEndpoints",
                                     "location": "eastus"
                                   }
                                 ],
                                 "nextLink": "CROSS_LISTING_LINK"
                               }
                               """.Replace("CROSS_LISTING_LINK", crossListingNextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: type-scoped subscription listing did not stop on cross-listing nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListSubscriptionResourcesByTypeAsync(
                "token-abc",
                subscriptionId,
                "Microsoft.Network/privateEndpoints",
                CancellationToken.None));

        Assert.Contains("resource scope", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListPrivateDnsZoneVirtualNetworkLinksAsync_rejects_next_link_for_different_zone_resource_id()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string zoneResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/zone-a.com";
        const string otherZoneResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/zone-b.com";
        const string crossZoneNextLink =
            $"https://management.azure.com{otherZoneResourceId}/virtualNetworkLinks?api-version=2020-06-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/zone-a.com/virtualNetworkLinks/link-a",
                                     "name": "link-a",
                                     "type": "Microsoft.Network/privateDnsZones/virtualNetworkLinks",
                                     "properties": { "virtualNetwork": { "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a" } }
                                   }
                                 ],
                                 "nextLink": "CROSS_ZONE_LINK"
                               }
                               """.Replace("CROSS_ZONE_LINK", crossZoneNextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: private DNS vnet link listing did not stop on cross-zone nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListPrivateDnsZoneVirtualNetworkLinksAsync(
                "token-abc",
                subscriptionId,
                zoneResourceId,
                CancellationToken.None));

        Assert.Contains("resource scope", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListVirtualNetworkPeeringsAsync_rejects_next_link_for_different_virtual_network_resource_id()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string vnetResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
        const string otherVnetResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";
        const string crossVnetNextLink =
            $"https://management.azure.com{otherVnetResourceId}/virtualNetworkPeerings?api-version=2023-09-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a/virtualNetworkPeerings/peer-a",
                                     "name": "peer-a",
                                     "type": "Microsoft.Network/virtualNetworks/virtualNetworkPeerings",
                                     "location": "eastus"
                                   }
                                 ],
                                 "nextLink": "CROSS_VNET_LINK"
                               }
                               """.Replace("CROSS_VNET_LINK", crossVnetNextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: virtual network peering listing did not stop on cross-vnet nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListVirtualNetworkPeeringsAsync(
                "token-abc",
                subscriptionId,
                vnetResourceId,
                CancellationToken.None));

        Assert.Contains("resource scope", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListSubscriptionRoleEligibilitySchedulesAsync_rejects_next_link_for_different_role_listing_path()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string crossListingNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Authorization/roleAssignments?api-version=2022-04-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "properties": {
                                       "scope": "/subscriptions/11111111-1111-1111-1111-111111111111",
                                       "principalId": "22222222-2222-2222-2222-222222222222",
                                       "principalType": "User",
                                       "roleDefinitionId": "/subscriptions/11111111-1111-1111-1111-111111111111/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"
                                     }
                                   }
                                 ],
                                 "nextLink": "CROSS_LISTING_LINK"
                               }
                               """.Replace("CROSS_LISTING_LINK", crossListingNextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: role eligibility listing did not stop on cross-listing nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListSubscriptionRoleEligibilitySchedulesAsync(
                "token-abc",
                subscriptionId,
                CancellationToken.None));

        Assert.Contains("resource scope", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListSubscriptionRoleEligibilitySchedulesAsync_maps_eligible_assignments()
    {
        HttpMessageHandler handler = new RecordingHandler(
            (_, _) => Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""
                                                {
                                                  "value": [
                                                    {
                                                      "properties": {
                                                        "scope": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                                                        "principalId": "11111111-1111-1111-1111-111111111111",
                                                        "principalType": "User",
                                                        "roleDefinitionId": "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"
                                                      }
                                                    }
                                                  ]
                                                }
                                                """)
                }));

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> schedules =
            await client.ListSubscriptionRoleEligibilitySchedulesAsync(
                "token-abc",
                "11111111-1111-1111-1111-111111111111",
                CancellationToken.None);

        Assert.Single(schedules);
        Assert.Equal("eligible", schedules[0].PimEligibilityKind);
        Assert.Equal("11111111-1111-1111-1111-111111111111", schedules[0].PrincipalId);
    }

    [Fact]
    public async Task ListSubscriptionResourcesAsync_throws_when_next_link_targets_different_subscription()
    {
        const string requestedSubscriptionId = "11111111-1111-1111-1111-111111111111";
        const string otherSubscriptionId = "22222222-2222-2222-2222-222222222222";
        const string crossSubscriptionNextLink =
            $"https://management.azure.com/subscriptions/{otherSubscriptionId}/resources?api-version=2021-04-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                                     "name": "sa1",
                                     "type": "Microsoft.Storage/storageAccounts",
                                     "location": "eastus"
                                   }
                                 ],
                                 "nextLink": "CROSS_SUBSCRIPTION_LINK"
                               }
                               """.Replace("CROSS_SUBSCRIPTION_LINK", crossSubscriptionNextLink, StringComparison.Ordinal);

        string secondPageBody = """
                                {
                                  "value": [
                                    {
                                      "id": "/subscriptions/22222222-2222-2222-2222-222222222222/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa2",
                                      "name": "sa2",
                                      "type": "Microsoft.Storage/storageAccounts",
                                      "location": "westus"
                                    }
                                  ]
                                }
                                """;

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                if (current == 2)
                {
                    Assert.Equal(crossSubscriptionNextLink, request.RequestUri?.AbsoluteUri);

                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(secondPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: ARM resource listing did not stop on cross-subscription nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListSubscriptionResourcesAsync(
                "token-abc",
                requestedSubscriptionId,
                CancellationToken.None));

        Assert.Contains("resource scope", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListSubscriptionResourcesAsync_logs_when_arm_row_missing_id_or_type()
    {
        Mock<ILogger<GetOnlyHostedAzureArmReadClient>> logger = new();
        logger.Setup(l => l.IsEnabled(LogLevel.Warning)).Returns(true);

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) => Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""
                                                {
                                                  "value": [
                                                    {
                                                      "name": "orphan",
                                                      "location": "eastus"
                                                    }
                                                  ]
                                                }
                                                """)
                }));

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, logger.Object);

        IReadOnlyList<HostedAzureArmResourceRecord> resources = await client.ListSubscriptionResourcesAsync(
            "token-abc",
            "11111111-1111-1111-1111-111111111111",
            CancellationToken.None);

        Assert.Empty(resources);

        logger.Verify(
            static l => l.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, _) => v.ToString()!.Contains("missing id or type", StringComparison.Ordinal)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task TryGetSubscriptionDisplayNameAsync_returns_arm_display_name()
    {
        List<string> methods = [];
        List<string> uris = [];

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                methods.Add(request.Method.Method);
                uris.Add(request.RequestUri?.AbsoluteUri ?? string.Empty);

                const string body = """
                                    {
                                      "subscriptionId": "11111111-1111-1111-1111-111111111111",
                                      "displayName": "Contoso Production",
                                      "state": "Enabled"
                                    }
                                    """;

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(body)
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        string? name = await client.TryGetSubscriptionDisplayNameAsync(
            "token-abc",
            "11111111-1111-1111-1111-111111111111",
            CancellationToken.None);

        Assert.Equal("Contoso Production", name);
        Assert.All(methods, method => Assert.Equal(HttpMethod.Get.Method, method));
        Assert.Contains(
            uris,
            uri => uri.StartsWith(
                "https://management.azure.com/subscriptions/11111111-1111-1111-1111-111111111111?",
                StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task TryGetSubscriptionDisplayNameAsync_returns_null_when_display_name_is_guid()
    {
        HttpMessageHandler handler = new RecordingHandler(
            (_, _) => Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""
                                                {
                                                  "displayName": "11111111-1111-1111-1111-111111111111"
                                                }
                                                """)
                }));

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        string? name = await client.TryGetSubscriptionDisplayNameAsync(
            "token-abc",
            "11111111-1111-1111-1111-111111111111",
            CancellationToken.None);

        Assert.Null(name);
    }

    [Fact]
    public async Task TryGetSubscriptionDisplayNameAsync_returns_null_on_http_failure()
    {
        HttpMessageHandler handler = new RecordingHandler(
            (_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.Forbidden)));

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        string? name = await client.TryGetSubscriptionDisplayNameAsync(
            "token-abc",
            "11111111-1111-1111-1111-111111111111",
            CancellationToken.None);

        Assert.Null(name);
    }

    [Fact]
    public async Task ListManagementGroupSubscriptionIdsAsync_maps_subscription_ids()
    {
        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                Assert.Contains("/managementGroups/corp/subscriptions", request.RequestUri?.AbsoluteUri);

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent("""
                                                    {
                                                      "value": [
                                                        {
                                                          "id": "/subscriptions/11111111-1111-1111-1111-111111111111",
                                                          "name": "11111111-1111-1111-1111-111111111111"
                                                        },
                                                        {
                                                          "id": "/subscriptions/22222222-2222-2222-2222-222222222222",
                                                          "name": "22222222-2222-2222-2222-222222222222"
                                                        }
                                                      ]
                                                    }
                                                    """)
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<string> subscriptionIds = await client.ListManagementGroupSubscriptionIdsAsync(
            "token-abc",
            "corp",
            CancellationToken.None);

        Assert.Equal(2, subscriptionIds.Count);
        Assert.Contains("11111111-1111-1111-1111-111111111111", subscriptionIds);
        Assert.Contains("22222222-2222-2222-2222-222222222222", subscriptionIds);
    }

    [Fact]
    public async Task ListManagementGroupRoleAssignmentsAsync_maps_management_group_assignments()
    {
        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                Assert.Contains("/managementGroups/corp/providers/Microsoft.Authorization/roleAssignments", request.RequestUri?.AbsoluteUri);

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent("""
                                                    {
                                                      "value": [
                                                        {
                                                          "properties": {
                                                            "scope": "/providers/Microsoft.Management/managementGroups/corp",
                                                            "principalId": "11111111-1111-1111-1111-111111111111",
                                                            "principalType": "User",
                                                            "roleDefinitionId": "/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"
                                                          }
                                                        }
                                                      ]
                                                    }
                                                    """)
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmRoleAssignmentRecord> assignments =
            await client.ListManagementGroupRoleAssignmentsAsync(
                "token-abc",
                "corp",
                CancellationToken.None);

        Assert.Single(assignments);
        Assert.Equal("standing", assignments[0].PimEligibilityKind);
        Assert.Contains("managementGroups/corp", assignments[0].Scope, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ListManagementGroupRoleAssignmentsAsync_rejects_next_link_for_different_role_listing_path()
    {
        const string crossListingNextLink =
            "https://management.azure.com/providers/Microsoft.Management/managementGroups/corp/providers/Microsoft.Authorization/roleEligibilitySchedules?api-version=2020-10-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "properties": {
                                       "scope": "/providers/Microsoft.Management/managementGroups/corp",
                                       "principalId": "11111111-1111-1111-1111-111111111111",
                                       "principalType": "User",
                                       "roleDefinitionId": "/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"
                                     }
                                   }
                                 ],
                                 "nextLink": "CROSS_LISTING_LINK"
                               }
                               """.Replace("CROSS_LISTING_LINK", crossListingNextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: management group role assignment listing did not stop on cross-listing nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListManagementGroupRoleAssignmentsAsync(
                "token-abc",
                "corp",
                CancellationToken.None));

        Assert.Contains("resource scope", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListSubscriptionPolicyAssignmentsAsync_maps_assignment_properties()
    {
        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                Assert.Contains("/providers/Microsoft.Authorization/policyAssignments", request.RequestUri?.AbsoluteUri);

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent("""
                                                    {
                                                      "value": [
                                                        {
                                                          "id": "/subscriptions/11111111-1111-1111-1111-111111111111/providers/Microsoft.Authorization/policyAssignments/assign1",
                                                          "name": "assign1",
                                                          "properties": {
                                                            "scope": "/subscriptions/11111111-1111-1111-1111-111111111111",
                                                            "policyDefinitionId": "/providers/Microsoft.Authorization/policyDefinitions/audit-storage"
                                                          }
                                                        }
                                                      ]
                                                    }
                                                    """)
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmPolicyAssignmentRecord> assignments =
            await client.ListSubscriptionPolicyAssignmentsAsync(
                "token-abc",
                "11111111-1111-1111-1111-111111111111",
                CancellationToken.None);

        Assert.Single(assignments);
        Assert.Equal("assign1", assignments[0].Name);
        Assert.Contains("policyDefinitions/audit-storage", assignments[0].PolicyDefinitionId, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ListSubscriptionPolicyAssignmentsAsync_rejects_next_link_for_different_policy_collection()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string crossCollectionNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Authorization/policyDefinitions?api-version=2021-06-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "id": "/subscriptions/11111111-1111-1111-1111-111111111111/providers/Microsoft.Authorization/policyAssignments/assign1",
                                     "name": "assign1",
                                     "properties": {
                                       "scope": "/subscriptions/11111111-1111-1111-1111-111111111111",
                                       "policyDefinitionId": "/providers/Microsoft.Authorization/policyDefinitions/audit-storage"
                                     }
                                   }
                                 ],
                                 "nextLink": "CROSS_COLLECTION_LINK"
                               }
                               """.Replace("CROSS_COLLECTION_LINK", crossCollectionNextLink, StringComparison.Ordinal);

        int requestCount = 0;
        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: policy assignment listing followed a different policy collection.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListSubscriptionPolicyAssignmentsAsync(
                "token-abc",
                subscriptionId,
                CancellationToken.None));

        Assert.Contains("resource scope", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListSubscriptionPolicyAssignmentDocumentsAsync_rejects_next_link_for_different_policy_collection()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string crossCollectionNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Authorization/policyDefinitions?api-version=2021-06-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "id": "/subscriptions/11111111-1111-1111-1111-111111111111/providers/Microsoft.Authorization/policyAssignments/assign1",
                                     "name": "assign1"
                                   }
                                 ],
                                 "nextLink": "CROSS_COLLECTION_LINK"
                               }
                               """.Replace("CROSS_COLLECTION_LINK", crossCollectionNextLink, StringComparison.Ordinal);

        int requestCount = 0;
        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: policy assignment document listing followed a different policy collection.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListSubscriptionPolicyAssignmentDocumentsAsync(
                "token-abc",
                subscriptionId,
                CancellationToken.None));

        Assert.Contains("resource scope", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListDiagnosticSettingsAsync_rejects_next_link_for_different_resource_id()
    {
        const string storageResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        const string otherStorageResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa2";
        const string crossResourceNextLink =
            $"https://management.azure.com{otherStorageResourceId}/providers/Microsoft.Insights/diagnosticSettings?api-version=2021-05-01-preview&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "diag-page-one",
                                     "properties": {
                                       "workspaceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/ws1"
                                     }
                                   }
                                 ],
                                 "nextLink": "CROSS_RESOURCE_LINK"
                               }
                               """.Replace("CROSS_RESOURCE_LINK", crossResourceNextLink, StringComparison.Ordinal);

        string secondPageBody = """
                                {
                                  "value": [
                                    {
                                      "name": "diag-leaked",
                                      "properties": {
                                        "workspaceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/ws2"
                                      }
                                    }
                                  ]
                                }
                                """;

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                if (current == 2)
                {
                    Assert.Equal(crossResourceNextLink, request.RequestUri?.AbsoluteUri);

                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(secondPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: diagnostic setting listing did not stop on cross-resource nextLink.");
            });

        GetOnlyHostedAzureArmReadClient client = new(
            new HttpClient(handler),
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureDiagnosticSettingsCollectResult result = await client.ListDiagnosticSettingsAsync(
            "token-abc",
            [
                new HostedAzureArmResourceRecord(
                    "Microsoft.Storage/storageAccounts",
                    storageResourceId,
                    "sa1",
                    "eastus",
                    null,
                    null,
                    new Dictionary<string, object?>()),
            ],
            CancellationToken.None);

        Assert.Equal(1, requestCount);
        Assert.True(result.PartialCollection);
        Assert.Single(result.Settings);
        Assert.Equal("diag-page-one", result.Settings[0].Name);
    }

    [Fact]
    public async Task ListDiagnosticSettingsAsync_rejects_next_link_with_diagnostic_settings_prefix_collision()
    {
        const string storageResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        string prefixCollisionNextLink =
            $"https://management.azure.com{storageResourceId}/providers/Microsoft.Insights/diagnosticSettingsEvil?api-version=2021-05-01-preview";
        string firstPageBody = """
                               {
                                 "value": [],
                                 "nextLink": "PREFIX_COLLISION_LINK"
                               }
                               """.Replace("PREFIX_COLLISION_LINK", prefixCollisionNextLink, StringComparison.Ordinal);

        int requestCount = 0;
        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                Interlocked.Increment(ref requestCount);

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(firstPageBody)
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListDiagnosticSettingsAsync(
                "token-abc",
                [
                    new HostedAzureArmResourceRecord(
                        "Microsoft.Storage/storageAccounts",
                        storageResourceId,
                        "sa1",
                        "eastus",
                        null,
                        null,
                        new Dictionary<string, object?>()),
                ],
                CancellationToken.None));

        Assert.Contains("resource", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListDiagnosticSettingsAsync_continues_after_cross_resource_next_link_for_one_resource()
    {
        const string badStorageResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa-bad";
        const string goodStorageResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa-good";
        const string crossResourceNextLink =
            $"https://management.azure.com{goodStorageResourceId}/providers/Microsoft.Insights/diagnosticSettings?api-version=2021-05-01-preview&$skiptoken=leak";

        string badFirstPageBody = """
                                  {
                                    "value": [
                                      {
                                        "name": "diag-page-one",
                                        "properties": {
                                          "workspaceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/ws1"
                                        }
                                      }
                                    ],
                                    "nextLink": "CROSS_RESOURCE_LINK"
                                  }
                                  """.Replace("CROSS_RESOURCE_LINK", crossResourceNextLink, StringComparison.Ordinal);

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                string uri = request.RequestUri!.AbsoluteUri;

                if (uri.Contains("sa-bad", StringComparison.OrdinalIgnoreCase))
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(badFirstPageBody)
                        });
                }

                if (uri.Contains("sa-good", StringComparison.OrdinalIgnoreCase))
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent("""
                                                        {
                                                          "value": [
                                                            {
                                                              "name": "diag-good",
                                                              "properties": {
                                                                "workspaceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/ws2"
                                                              }
                                                            }
                                                          ]
                                                        }
                                                        """)
                        });
                }

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
            });

        GetOnlyHostedAzureArmReadClient client = new(
            new HttpClient(handler),
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureDiagnosticSettingsCollectResult result = await client.ListDiagnosticSettingsAsync(
            "token-abc",
            [
                new HostedAzureArmResourceRecord(
                    "Microsoft.Storage/storageAccounts",
                    badStorageResourceId,
                    "sa-bad",
                    "eastus",
                    null,
                    null,
                    new Dictionary<string, object?>()),
                new HostedAzureArmResourceRecord(
                    "Microsoft.Storage/storageAccounts",
                    goodStorageResourceId,
                    "sa-good",
                    "eastus",
                    null,
                    null,
                    new Dictionary<string, object?>()),
            ],
            CancellationToken.None);

        Assert.True(result.PartialCollection);
        Assert.Equal(2, result.Settings.Count);
        Assert.Contains(result.Settings, setting => setting.TargetResourceId == badStorageResourceId);
        Assert.Contains(result.Settings, setting => setting.TargetResourceId == goodStorageResourceId);
    }

    [Fact]
    public async Task ListDiagnosticSettingsAsync_continues_after_invalid_json_for_one_resource()
    {
        const string badStorageResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa-bad";
        const string goodStorageResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa-good";

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                string uri = request.RequestUri!.AbsoluteUri;

                if (uri.Contains("sa-bad", StringComparison.OrdinalIgnoreCase))
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent("{ not-json")
                        });
                }

                if (uri.Contains("sa-good", StringComparison.OrdinalIgnoreCase))
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent("""
                                                        {
                                                          "value": [
                                                            {
                                                              "name": "diag-to-law",
                                                              "properties": {
                                                                "workspaceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/ws1"
                                                              }
                                                            }
                                                          ]
                                                        }
                                                        """)
                        });
                }

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
            });

        GetOnlyHostedAzureArmReadClient client = new(
            new HttpClient(handler),
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureDiagnosticSettingsCollectResult result = await client.ListDiagnosticSettingsAsync(
            "token-abc",
            [
                new HostedAzureArmResourceRecord(
                    "Microsoft.Storage/storageAccounts",
                    badStorageResourceId,
                    "sa-bad",
                    "eastus",
                    null,
                    null,
                    new Dictionary<string, object?>()),
                new HostedAzureArmResourceRecord(
                    "Microsoft.Storage/storageAccounts",
                    goodStorageResourceId,
                    "sa-good",
                    "eastus",
                    null,
                    null,
                    new Dictionary<string, object?>()),
            ],
            CancellationToken.None);

        Assert.False(result.PartialCollection);
        Assert.Single(result.Settings);
        Assert.Equal(goodStorageResourceId, result.Settings[0].TargetResourceId);
    }

    [Fact]
    public async Task ListDiagnosticSettingsAsync_does_not_mark_partial_when_resource_returns_forbidden_with_no_settings()
    {
        const string storageResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.Forbidden)));

        GetOnlyHostedAzureArmReadClient client = new(
            new HttpClient(handler),
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureDiagnosticSettingsCollectResult result = await client.ListDiagnosticSettingsAsync(
            "token-abc",
            [
                new HostedAzureArmResourceRecord(
                    "Microsoft.Storage/storageAccounts",
                    storageResourceId,
                    "sa1",
                    "eastus",
                    null,
                    null,
                    new Dictionary<string, object?>()),
            ],
            CancellationToken.None);

        Assert.False(result.PartialCollection);
        Assert.Empty(result.Settings);
    }

    [Fact]
    public async Task ListDiagnosticSettingsAsync_marks_partial_when_follow_up_page_body_is_invalid_json()
    {
        const string storageResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        const string nextLink =
            $"https://management.azure.com{storageResourceId}/providers/Microsoft.Insights/diagnosticSettings?api-version=2021-05-01-preview&$skiptoken=page2";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "diag-to-law",
                                     "properties": {
                                       "workspaceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/ws1"
                                     }
                                   }
                                 ],
                                 "nextLink": "DIAG_SETTINGS_NEXT_LINK"
                               }
                               """.Replace("DIAG_SETTINGS_NEXT_LINK", nextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent("{ not-json")
                    });
            });

        GetOnlyHostedAzureArmReadClient client = new(
            new HttpClient(handler),
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureDiagnosticSettingsCollectResult result = await client.ListDiagnosticSettingsAsync(
            "token-abc",
            [
                new HostedAzureArmResourceRecord(
                    "Microsoft.Storage/storageAccounts",
                    storageResourceId,
                    "sa1",
                    "eastus",
                    null,
                    null,
                    new Dictionary<string, object?>()),
            ],
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.True(result.PartialCollection);
        Assert.Single(result.Settings);
    }

    [Fact]
    public async Task ListDiagnosticSettingsAsync_marks_partial_when_max_page_cap_reached_after_settings_collected()
    {
        const string storageResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int page = Interlocked.Increment(ref requestCount);
                string? nextLink = page <= 64
                    ? $"https://management.azure.com{storageResourceId}/providers/Microsoft.Insights/diagnosticSettings?api-version=2021-05-01-preview&$skiptoken=page-{page + 1}"
                    : null;
                string nextLinkJson = nextLink is null ? "null" : $"\"{nextLink}\"";

                string body = $$"""
                                  {
                                    "value": [
                                      {
                                        "name": "diag-{{page}}",
                                        "properties": {
                                          "workspaceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/ws{{page}}"
                                        }
                                      }
                                    ],
                                    "nextLink": {{nextLinkJson}}
                                  }
                                  """;

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(body)
                    });
            });

        GetOnlyHostedAzureArmReadClient client = new(
            new HttpClient(handler),
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureDiagnosticSettingsCollectResult result = await client.ListDiagnosticSettingsAsync(
            "token-abc",
            [
                new HostedAzureArmResourceRecord(
                    "Microsoft.Storage/storageAccounts",
                    storageResourceId,
                    "sa1",
                    "eastus",
                    null,
                    null,
                    new Dictionary<string, object?>()),
            ],
            CancellationToken.None);

        Assert.Equal(64, requestCount);
        Assert.True(result.PartialCollection);
        Assert.Equal(64, result.Settings.Count);
    }

    [Fact]
    public async Task ListDiagnosticSettingsAsync_marks_partial_when_follow_up_page_returns_forbidden_after_settings_collected()
    {
        const string storageResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        const string nextLink =
            $"https://management.azure.com{storageResourceId}/providers/Microsoft.Insights/diagnosticSettings?api-version=2021-05-01-preview&$skiptoken=page2";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "diag-to-law",
                                     "properties": {
                                       "workspaceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/ws1"
                                     }
                                   }
                                 ],
                                 "nextLink": "DIAG_SETTINGS_NEXT_LINK"
                               }
                               """.Replace("DIAG_SETTINGS_NEXT_LINK", nextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.Forbidden));
            });

        GetOnlyHostedAzureArmReadClient client = new(
            new HttpClient(handler),
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureDiagnosticSettingsCollectResult result = await client.ListDiagnosticSettingsAsync(
            "token-abc",
            [
                new HostedAzureArmResourceRecord(
                    "Microsoft.Storage/storageAccounts",
                    storageResourceId,
                    "sa1",
                    "eastus",
                    null,
                    null,
                    new Dictionary<string, object?>()),
            ],
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.True(result.PartialCollection);
        Assert.Single(result.Settings);
    }

    [Fact]
    public async Task ListDiagnosticSettingsAsync_maps_workspace_targets_for_path_relevant_resources()
    {
        const string storageResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                Assert.Contains("diagnosticSettings", request.RequestUri?.AbsoluteUri, StringComparison.Ordinal);

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent("""
                                                    {
                                                      "value": [
                                                        {
                                                          "name": "diag-to-law",
                                                          "properties": {
                                                            "workspaceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/ws1"
                                                          }
                                                        }
                                                      ]
                                                    }
                                                    """)
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureDiagnosticSettingsCollectResult result = await client.ListDiagnosticSettingsAsync(
            "token-abc",
            [
                new HostedAzureArmResourceRecord(
                    "Microsoft.Storage/storageAccounts",
                    storageResourceId,
                    "sa1",
                    "eastus",
                    null,
                    null,
                    new Dictionary<string, object?>()),
                new HostedAzureArmResourceRecord(
                    "Microsoft.Compute/virtualMachines",
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1",
                    "vm1",
                    "eastus",
                    null,
                    null,
                    new Dictionary<string, object?>()),
            ],
            CancellationToken.None);

        Assert.False(result.PartialCollection);
        Assert.Single(result.Settings);
        Assert.Equal(storageResourceId, result.Settings[0].TargetResourceId);
        Assert.Equal("diag-to-law", result.Settings[0].Name);
    }

    [Fact]
    public async Task ListSubscriptionDefenderSummariesAsync_maps_subscription_secure_score()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                Assert.Contains("Microsoft.Security/secureScores", request.RequestUri?.AbsoluteUri, StringComparison.Ordinal);

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent("""
                                                    {
                                                      "value": [
                                                        {
                                                          "name": "ascScore",
                                                          "properties": {
                                                            "score": {
                                                              "percentage": 0.72
                                                            }
                                                          }
                                                        }
                                                      ]
                                                    }
                                                    """)
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmDefenderSummaryRecord> summaries =
            await client.ListSubscriptionDefenderSummariesAsync(
                "token-abc",
                subscriptionId,
                CancellationToken.None);

        Assert.Single(summaries);
        Assert.Equal($"/subscriptions/{subscriptionId}", summaries[0].ResourceId);
        Assert.Equal(72, summaries[0].SecureScore);
    }

    [Fact]
    public async Task ListSubscriptionDefenderSummariesAsync_follows_next_link_and_picks_highest_score()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string pageTwoLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Security/secureScores?api-version=2020-01-01&$skiptoken=page2";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "ascScore",
                                     "properties": {
                                       "score": {
                                         "percentage": 0.50
                                       }
                                     }
                                   }
                                 ],
                                 "nextLink": "PAGE_TWO_LINK"
                               }
                               """.Replace("PAGE_TWO_LINK", pageTwoLink, StringComparison.Ordinal);

        string secondPageBody = """
                                {
                                  "value": [
                                    {
                                      "name": "subscriptionScore",
                                      "properties": {
                                        "score": {
                                          "percentage": 0.90
                                        }
                                      }
                                    }
                                  ]
                                }
                                """;

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                Assert.Equal(pageTwoLink, request.RequestUri?.AbsoluteUri);

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(secondPageBody)
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmDefenderSummaryRecord> summaries =
            await client.ListSubscriptionDefenderSummariesAsync(
                "token-abc",
                subscriptionId,
                CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.Single(summaries);
        Assert.Equal(90, summaries[0].SecureScore);
    }

    [Fact]
    public async Task ListSubscriptionDefenderSummariesAsync_retains_best_score_when_max_pagination_limit_reached()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int page = Interlocked.Increment(ref requestCount);
                string? nextLink = page < 64
                    ? $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Security/secureScores?api-version=2020-01-01&$skiptoken=page-{page}"
                    : null;

                string nextLinkJson = nextLink is null ? "null" : $"\"{nextLink}\"";
                double percentage = page / 100.0;

                string body = $$"""
                                  {
                                    "value": [
                                      {
                                        "name": "subscriptionScore",
                                        "properties": {
                                          "score": {
                                            "percentage": {{percentage}}
                                          }
                                        }
                                      }
                                    ],
                                    "nextLink": {{nextLinkJson}}
                                  }
                                  """;

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(body)
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmDefenderSummaryRecord> summaries =
            await client.ListSubscriptionDefenderSummariesAsync(
                "token-abc",
                subscriptionId,
                CancellationToken.None);

        Assert.Equal(64, requestCount);
        Assert.Single(summaries);
        Assert.Equal(64, summaries[0].SecureScore);
    }

    [Fact]
    public async Task ListSubscriptionDefenderSummariesAsync_throws_when_next_link_targets_different_subscription()
    {
        const string requestedSubscriptionId = "11111111-1111-1111-1111-111111111111";
        const string otherSubscriptionId = "22222222-2222-2222-2222-222222222222";
        const string crossSubscriptionNextLink =
            $"https://management.azure.com/subscriptions/{otherSubscriptionId}/providers/Microsoft.Security/secureScores?api-version=2020-01-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "ascScore",
                                     "properties": {
                                       "score": {
                                         "percentage": 0.72
                                       }
                                     }
                                   }
                                 ],
                                 "nextLink": "CROSS_SUBSCRIPTION_LINK"
                               }
                               """.Replace("CROSS_SUBSCRIPTION_LINK", crossSubscriptionNextLink, StringComparison.Ordinal);

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) => Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(firstPageBody)
                }));

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListSubscriptionDefenderSummariesAsync(
                "token-abc",
                requestedSubscriptionId,
                CancellationToken.None));

        Assert.Contains("different subscription", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ListSubscriptionDefenderSummariesAsync_rejects_next_link_for_different_security_collection()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string crossCollectionNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Authorization/roleAssignments?api-version=2022-04-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "ascScore",
                                     "properties": {
                                       "score": {
                                         "percentage": 0.72
                                       }
                                     }
                                   }
                                 ],
                                 "nextLink": "CROSS_COLLECTION_LINK"
                               }
                               """.Replace("CROSS_COLLECTION_LINK", crossCollectionNextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: Defender secure score listing did not stop on cross-collection nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListSubscriptionDefenderSummariesAsync(
                "token-abc",
                subscriptionId,
                CancellationToken.None));

        Assert.Contains("resource scope", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task ListSubscriptionDefenderSummariesAsync_retains_best_score_when_next_link_repeats()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string repeatingNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Security/secureScores?api-version=2020-01-01&$skiptoken=repeat";

        string body = """
                      {
                        "value": [
                          {
                            "name": "ascScore",
                            "properties": {
                              "score": {
                                "percentage": 0.72
                              }
                            }
                          }
                        ],
                        "nextLink": "REPEATING_LINK"
                      }
                      """.Replace("REPEATING_LINK", repeatingNextLink, StringComparison.Ordinal);

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) => Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(body)
                }));

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmDefenderSummaryRecord> summaries =
            await client.ListSubscriptionDefenderSummariesAsync(
                "token-abc",
                subscriptionId,
                CancellationToken.None);

        Assert.Single(summaries);
        Assert.Equal(72, summaries[0].SecureScore);
    }

    [Fact]
    public async Task ListSubscriptionDefenderSummariesAsync_retains_best_score_when_later_page_body_is_invalid_json()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string nextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Security/secureScores?api-version=2020-01-01&$skiptoken=page2";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "ascScore",
                                     "properties": {
                                       "score": {
                                         "percentage": 0.55
                                       }
                                     }
                                   }
                                 ],
                                 "nextLink": "PAGE_TWO_LINK"
                               }
                               """.Replace("PAGE_TWO_LINK", nextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent("{ not-json")
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmDefenderSummaryRecord> summaries =
            await client.ListSubscriptionDefenderSummariesAsync(
                "token-abc",
                subscriptionId,
                CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.Single(summaries);
        Assert.Equal(55, summaries[0].SecureScore);
    }

    [Fact]
    public async Task ListSubscriptionResourcesAsync_captures_databricks_access_connector_identity_and_workspace_link()
    {
        const string connectorId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Databricks/accessConnectors/uc-connector";
        const string workspaceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Databricks/workspaces/analytics";

        const string body = """
                            {
                              "value": [
                                {
                                  "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Databricks/accessConnectors/uc-connector",
                                  "name": "uc-connector",
                                  "type": "Microsoft.Databricks/accessConnectors",
                                  "location": "eastus",
                                  "identity": {
                                    "type": "SystemAssigned",
                                    "principalId": "11111111-2222-3333-4444-555555555555"
                                  },
                                  "properties": {}
                                },
                                {
                                  "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Databricks/workspaces/analytics",
                                  "name": "analytics",
                                  "type": "Microsoft.Databricks/workspaces",
                                  "location": "eastus",
                                  "properties": {
                                    "accessConnector": {
                                      "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Databricks/accessConnectors/uc-connector",
                                      "identityType": "SystemAssigned"
                                    }
                                  }
                                }
                              ]
                            }
                            """;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) => Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(body)
                }));

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmResourceRecord> resources = await client.ListSubscriptionResourcesAsync(
            "token-abc",
            "11111111-1111-1111-1111-111111111111",
            CancellationToken.None);

        HostedAzureArmResourceRecord connector = Assert.Single(resources, resource => resource.ResourceId == connectorId);
        Assert.Contains("11111111-2222-3333-4444-555555555555", connector.Properties["identity"]?.ToString(), StringComparison.OrdinalIgnoreCase);

        HostedAzureArmResourceRecord workspace = Assert.Single(resources, resource => resource.ResourceId == workspaceId);
        Assert.Equal(connectorId, workspace.Properties[AzureInventoryDatabricksAccessConnector.IdPropertyKey]);
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_maps_plans_controls_assessments_and_contacts()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        string storageId = $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;
            string body = path switch
            {
                _ when path.Contains("/pricings", StringComparison.Ordinal) =>
                    """
                    {"value":[{"name":"StorageAccounts","properties":{"pricingTier":"Free","extensions":[{"name":"OnUploadMalwareScanning","isEnabled":"True"}]}}]}
                    """,
                _ when path.Contains("/secureScoreControls", StringComparison.Ordinal) =>
                    """
                    {"value":[{"name":"EnableMfa","properties":{"displayName":"MFA","score":{"current":2,"max":10,"percentage":0.2},"weight":4,"unhealthyResourceCount":3,"healthyResourceCount":1}}]}
                    """,
                _ when path.Contains("/secureScores", StringComparison.Ordinal) =>
                    """
                    {"value":[{"name":"ascScore","properties":{"score":{"percentage":0.4}}}]}
                    """,
                _ when path.Contains("/assessments", StringComparison.Ordinal) =>
                    "{\"value\":[{\"name\":\"key-1\",\"properties\":{\"displayName\":\"Storage should be private\",\"status\":{\"code\":\"Unhealthy\",\"cause\":\"public\"},\"metadata\":{\"severity\":\"High\",\"categories\":[\"Data\"]},\"resourceDetails\":{\"id\":\"" + storageId + "\"}}},{\"name\":\"key-1\",\"properties\":{\"displayName\":\"Storage should be private\",\"status\":{\"code\":\"Healthy\"},\"metadata\":{\"severity\":\"High\"},\"resourceDetails\":{\"id\":\"" + storageId + "\"}}}]}",
                _ when path.Contains("/securityContacts", StringComparison.Ordinal) =>
                    """
                    {"value":[{"name":"default","properties":{"emails":"soc@contoso.com","phone":"555-0100","alertNotifications":{"state":"On","minimalSeverity":"High"},"notificationsByRole":{"roles":["Owner"]}}}]}
                    """,
                _ => """{"value":[]}""",
            };

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        HostedAzureArmDefenderPricingRecord pricing = Assert.Single(result.Pricings);
        Assert.Equal("Free", pricing.Tier);
        Assert.Equal("OnUploadMalwareScanning=true", pricing.Extensions);
        HostedAzureArmDefenderScoreControlRecord control = Assert.Single(result.ScoreControls);
        Assert.Equal(20, control.Percentage);
        Assert.Equal(3, control.UnhealthyResourceCount);
        HostedAzureArmDefenderAssessmentRecord assessment = Assert.Single(result.Assessments);
        Assert.Equal(storageId.ToLowerInvariant(), assessment.ResourceId);
        Assert.Equal("High", assessment.Severity);
        HostedAzureArmDefenderAssessmentCountRecord count = Assert.Single(result.AssessmentCounts);
        Assert.Equal(1, count.HealthyCount);
        Assert.Equal(1, count.UnhealthyCount);
        HostedAzureArmDefenderSecurityContactRecord contact = Assert.Single(result.SecurityContacts);
        Assert.Equal("Collected", contact.CollectionStatus);
        Assert.Equal("soc@contoso.com", contact.Emails);
        Assert.DoesNotContain("555-0100", contact.Emails, StringComparison.Ordinal);
        Assert.True(contact.AlertsToAdmins);
        Assert.DoesNotContain(result.Warnings, warning => warning.Contains("555-0100", StringComparison.Ordinal));
    }

    [Fact]
    public void DefenderPlanCoverageWarnings_names_a_free_plan_when_that_resource_type_is_present()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        IReadOnlyList<string> warnings = DefenderPlanCoverageWarnings.Create(
            [
                new HostedAzureArmDefenderPricingRecord
                {
                    SubscriptionId = subscriptionId,
                    PricingName = "StorageAccounts",
                    Tier = "Free",
                },
                new HostedAzureArmDefenderPricingRecord
                {
                    SubscriptionId = subscriptionId,
                    PricingName = "VirtualMachines",
                    Tier = "Free",
                },
            ],
            [
                new HostedAzureArmResourceRecord(
                    "Microsoft.Storage/storageAccounts",
                    $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                    "sa1",
                    "eastus",
                    null,
                    null,
                    new Dictionary<string, object?>()),
            ]);

        Assert.Equal(["defender-plan-off:StorageAccounts"], warnings);
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_http_403_does_not_throw()
    {
        HttpMessageHandler handler = new RecordingHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.Forbidden)));
        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            "11111111-1111-1111-1111-111111111111",
            CancellationToken.None);

        Assert.Empty(result.Pricings);
        Assert.Empty(result.Assessments);
        Assert.Equal("Unavailable", Assert.Single(result.SecurityContacts).CollectionStatus);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-security-contacts-not-collected", StringComparison.Ordinal));
        Assert.DoesNotContain(result.Warnings, warning => warning.Contains("defender-security-contact-missing", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_rejects_cross_subscription_next_link()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        int calls = 0;
        HttpMessageHandler handler = new RecordingHandler((_, _) =>
        {
            calls++;
            string body = calls == 1
                ? "{\"value\":[{\"name\":\"VirtualMachines\",\"properties\":{\"pricingTier\":\"Standard\"}}],\"nextLink\":\"https://management.azure.com/subscriptions/22222222-2222-2222-2222-222222222222/providers/Microsoft.Security/pricings?api-version=2024-01-01\"}"
                : """{"value":[]}""";
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(body) });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(1, calls);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-companions-rejected-next-link", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_warns_when_defender_pricings_pagination_hits_page_cap()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        int pricingRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/pricings", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref pricingRequests);
            string? nextLink = page <= 64
                ? $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Security/pricings?api-version=2024-01-01&$skiptoken=page-{page}"
                : null;
            string nextLinkJson = nextLink is null ? "null" : $"\"{nextLink}\"";

            string body = $$"""
                {
                  "value": [
                    {
                      "name": "Plan{{page}}",
                      "properties": { "pricingTier": "Free" }
                    }
                  ],
                  "nextLink": {{nextLinkJson}}
                }
                """;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(64, result.Pricings.Count);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-pricings-truncated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_clears_pricings_when_first_pricings_page_returns_http_500()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.Contains("/pricings", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"value":[]}"""),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Empty(result.Pricings);
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-pricings.json collection failed; HTTP 500", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_clears_pricings_when_first_pricings_page_is_invalid_json()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.Contains("/pricings", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("not-json"),
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"value":[]}"""),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Empty(result.Pricings);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-pricings.json collection failed; invalid JSON", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_retains_pricings_when_follow_up_pricings_page_is_invalid_json()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        int pricingRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/pricings", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int call = Interlocked.Increment(ref pricingRequests);

            if (call == 1)
            {
                string body = $$"""
                    {
                      "value": [
                        { "name": "StorageAccounts", "properties": { "pricingTier": "Free" } }
                      ],
                      "nextLink": "https://management.azure.com/subscriptions/{{subscriptionId}}/providers/Microsoft.Security/pricings?api-version=2024-01-01&$skiptoken=page-2"
                    }
                    """;

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(body),
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("not-json"),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Single(result.Pricings);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-pricings.json collection failed; invalid JSON", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_warns_when_defender_assessments_pagination_hits_page_cap()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        int assessmentRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/assessments", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref assessmentRequests);
            string? nextLink = page <= 64
                ? $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Security/assessments?api-version=2021-06-01&$skiptoken=page-{page}"
                : null;
            string nextLinkJson = nextLink is null ? "null" : $"\"{nextLink}\"";

            string body = $$"""
                {
                  "value": [
                    {
                      "name": "assessment-{{page}}",
                      "properties": {
                        "displayName": "Test",
                        "status": { "code": "Healthy" },
                        "metadata": { "severity": "Low" }
                      }
                    }
                  ],
                  "nextLink": {{nextLinkJson}}
                }
                """;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Contains(result.Warnings, warning => warning.Contains("defender-assessments-truncated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_rejects_defender_pricings_next_link_with_diagnostic_settings_scope()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string storageResourceId =
            "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        string crossScopeNextLink =
            $"https://management.azure.com{storageResourceId}/providers/Microsoft.Insights/diagnosticSettings?api-version=2021-05-01-preview";
        int pricingRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/pricings", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            Interlocked.Increment(ref pricingRequests);
            string body = $$"""
                {
                  "value": [
                    { "name": "VirtualMachines", "properties": { "pricingTier": "Standard" } }
                  ],
                  "nextLink": "{{crossScopeNextLink}}"
                }
                """;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(1, pricingRequests);
        Assert.Single(result.Pricings);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-companions-rejected-next-link", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_warns_when_defender_secure_scores_pagination_hits_page_cap()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        int secureScoreRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.EndsWith("/secureScores", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref secureScoreRequests);
            string? nextLink = page <= 64
                ? $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Security/secureScores?api-version=2020-01-01&$skiptoken=page-{page}"
                : null;
            string nextLinkJson = nextLink is null ? "null" : $"\"{nextLink}\"";

            string body = $$"""
                {
                  "value": [
                    { "name": "score-{{page}}" }
                  ],
                  "nextLink": {{nextLinkJson}}
                }
                """;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Contains(result.Warnings, warning => warning.Contains("defender-score-controls-truncated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_warns_when_defender_security_contacts_pagination_hits_page_cap()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        int contactRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/securityContacts", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref contactRequests);
            string? nextLink = page <= 64
                ? $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Security/securityContacts?api-version=2020-01-01&$skiptoken=page-{page}"
                : null;
            string nextLinkJson = nextLink is null ? "null" : $"\"{nextLink}\"";

            string body = $$"""
                {
                  "value": [
                    {
                      "name": "contact-{{page}}",
                      "properties": {
                        "emails": "soc{{page}}@contoso.com",
                        "alertNotifications": { "state": "On", "minimalSeverity": "High" }
                      }
                    }
                  ],
                  "nextLink": {{nextLinkJson}}
                }
                """;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(64, contactRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-security-contacts-truncated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_warns_when_defender_secure_score_controls_pagination_hits_page_cap()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        int controlListingRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.EndsWith("/secureScores", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        """
                        {"value":[{"name":"ascScore","properties":{"score":{"percentage":0.5}}}],"nextLink":null}
                        """),
                });
            }

            if (!path.Contains("/secureScoreControls", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref controlListingRequests);
            string? nextLink = page <= 64
                ? $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Security/secureScores/ascScore/secureScoreControls?api-version=2020-01-01&$skiptoken=page-{page}"
                : null;
            string nextLinkJson = nextLink is null ? "null" : $"\"{nextLink}\"";

            string body = $$"""
                {
                  "value": [
                    {
                      "name": "control-{{page}}",
                      "properties": {
                        "displayName": "Control {{page}}",
                        "score": { "current": 1, "max": 2, "percentage": 0.5 },
                        "weight": 1,
                        "unhealthyResourceCount": 0,
                        "healthyResourceCount": 1
                      }
                    }
                  ],
                  "nextLink": {{nextLinkJson}}
                }
                """;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(64, controlListingRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-score-controls-truncated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_warns_when_defender_secure_score_name_cap_truncates_before_controls_fetch()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.EndsWith("/secureScores", StringComparison.OrdinalIgnoreCase))
            {
                string body = """
                    {
                      "value": [
                        { "name": "score-a", "properties": { "score": { "percentage": 0.1 } } },
                        { "name": "score-b", "properties": { "score": { "percentage": 0.2 } } },
                        { "name": "score-c", "properties": { "score": { "percentage": 0.3 } } },
                        { "name": "score-d", "properties": { "score": { "percentage": 0.4 } } },
                        { "name": "score-e", "properties": { "score": { "percentage": 0.5 } } },
                        { "name": "score-f", "properties": { "score": { "percentage": 0.6 } } }
                      ],
                      "nextLink": null
                    }
                    """;

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(body),
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"value":[]}"""),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Contains(result.Warnings, warning => warning.Contains("defender-score-controls-truncated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_counts_unhealthy_assessment_without_resource_id_but_omits_detail_row()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/assessments", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            string body = """
                {
                  "value": [
                    {
                      "name": "key-missing-resource",
                      "properties": {
                        "displayName": "Missing resource id",
                        "status": { "code": "Unhealthy" },
                        "metadata": { "severity": "Medium" }
                      }
                    }
                  ],
                  "nextLink": null
                }
                """;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Empty(result.Assessments);
        HostedAzureArmDefenderAssessmentCountRecord count = Assert.Single(result.AssessmentCounts);
        Assert.Equal(1, count.UnhealthyCount);
        Assert.Equal(0, count.HealthyCount);
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_retains_pricings_when_follow_up_pricings_page_returns_http_500()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        int pricingRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/pricings", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int call = Interlocked.Increment(ref pricingRequests);

            if (call == 1)
            {
                string body = $$"""
                    {
                      "value": [
                        { "name": "StorageAccounts", "properties": { "pricingTier": "Free" } }
                      ],
                      "nextLink": "https://management.azure.com/subscriptions/{{subscriptionId}}/providers/Microsoft.Security/pricings?api-version=2024-01-01&$skiptoken=page-2"
                    }
                    """;

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(body),
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Single(result.Pricings);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-pricings.json collection failed; HTTP 500", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_retains_score_controls_when_follow_up_controls_page_returns_http_500()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        int controlRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.EndsWith("/secureScores", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        """
                        {"value":[{"name":"ascScore","properties":{"score":{"percentage":0.5}}}],"nextLink":null}
                        """),
                });
            }

            if (!path.Contains("/secureScoreControls", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int call = Interlocked.Increment(ref controlRequests);

            if (call == 1)
            {
                string body = $$"""
                    {
                      "value": [
                        {
                          "name": "control-retained",
                          "properties": {
                            "displayName": "Retained control",
                            "score": { "current": 1, "max": 2, "percentage": 0.5 },
                            "weight": 1,
                            "unhealthyResourceCount": 0,
                            "healthyResourceCount": 1
                          }
                        }
                      ],
                      "nextLink": "https://management.azure.com/subscriptions/{{subscriptionId}}/providers/Microsoft.Security/secureScores/ascScore/secureScoreControls?api-version=2020-01-01&$skiptoken=page-2"
                    }
                    """;

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(body),
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        HostedAzureArmDefenderScoreControlRecord control = Assert.Single(result.ScoreControls);
        Assert.Equal("control-retained", control.ControlName);
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-score-controls.json collection failed; HTTP 500", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_clears_all_score_controls_when_first_secure_scores_page_returns_http_500()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        int secureScoreRequests = 0;
        int controlRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.EndsWith("/secureScores", StringComparison.OrdinalIgnoreCase))
            {
                Interlocked.Increment(ref secureScoreRequests);
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
            }

            if (path.Contains("/secureScoreControls", StringComparison.Ordinal))
            {
                Interlocked.Increment(ref controlRequests);
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"value":[]}"""),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(1, secureScoreRequests);
        Assert.Equal(0, controlRequests);
        Assert.Empty(result.ScoreControls);
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-score-controls.json collection failed; HTTP 500", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_retains_score_controls_when_follow_up_secure_scores_page_returns_http_500()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        int secureScoreRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.EndsWith("/secureScores", StringComparison.OrdinalIgnoreCase))
            {
                int page = Interlocked.Increment(ref secureScoreRequests);

                if (page == 1)
                {
                    string body = $$"""
                        {
                          "value": [
                            { "name": "ascScore", "properties": { "score": { "percentage": 0.5 } } },
                            { "name": "customScore", "properties": { "score": { "percentage": 0.4 } } }
                          ],
                          "nextLink": "https://management.azure.com/subscriptions/{{subscriptionId}}/providers/Microsoft.Security/secureScores?api-version=2020-01-01&$skiptoken=page-2"
                        }
                        """;

                    return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(body),
                    });
                }

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
            }

            if (!path.Contains("/secureScoreControls", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    """
                    {
                      "value": [
                        {
                          "name": "control-retained",
                          "properties": {
                            "displayName": "Retained control",
                            "score": { "current": 1, "max": 2, "percentage": 0.5 },
                            "weight": 1,
                            "unhealthyResourceCount": 0,
                            "healthyResourceCount": 1
                          }
                        }
                      ]
                    }
                    """),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(2, secureScoreRequests);
        Assert.Equal(2, result.ScoreControls.Count);
        Assert.All(result.ScoreControls, control => Assert.Equal("control-retained", control.ControlName));
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-score-controls.json collection failed; HTTP 500", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_clears_score_controls_for_score_when_first_controls_page_returns_http_500()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        int controlRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.EndsWith("/secureScores", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        """
                        {"value":[{"name":"ascScore","properties":{"score":{"percentage":0.5}}}],"nextLink":null}
                        """),
                });
            }

            if (!path.Contains("/secureScoreControls", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            Interlocked.Increment(ref controlRequests);
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(1, controlRequests);
        Assert.Empty(result.ScoreControls);
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-score-controls.json collection failed; HTTP 500", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_rejects_defender_assessments_next_link_with_federated_credentials_scope()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        string crossScopeNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/uami/federatedIdentityCredentials?api-version=2021-06-01";
        int assessmentRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/assessments", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            Interlocked.Increment(ref assessmentRequests);
            string body = $$"""
                {
                  "value": [
                    {
                      "name": "assessment-1",
                      "properties": {
                        "displayName": "Test",
                        "status": { "code": "Healthy" },
                        "metadata": { "severity": "Low" }
                      }
                    }
                  ],
                  "nextLink": "{{crossScopeNextLink}}"
                }
                """;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(1, assessmentRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-companions-rejected-next-link", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_rejects_defender_assessments_next_link_with_pricings_scope()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        string crossScopeNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Security/pricings?api-version=2024-01-01&$skiptoken=leak";
        int assessmentRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/assessments", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            Interlocked.Increment(ref assessmentRequests);
            string body = $$"""
                {
                  "value": [
                    {
                      "name": "assessment-1",
                      "properties": {
                        "displayName": "Test",
                        "status": { "code": "Healthy" },
                        "metadata": { "severity": "Low" }
                      }
                    }
                  ],
                  "nextLink": "{{crossScopeNextLink}}"
                }
                """;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(1, assessmentRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-companions-rejected-next-link", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_rejects_defender_pricings_next_link_with_assessments_scope()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        string crossScopeNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Security/assessments?api-version=2024-01-01&$skiptoken=leak";
        int pricingRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/pricings", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            Interlocked.Increment(ref pricingRequests);
            string body = $$"""
                {
                  "value": [
                    { "name": "VirtualMachines", "properties": { "pricingTier": "Standard" } }
                  ],
                  "nextLink": "{{crossScopeNextLink}}"
                }
                """;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(1, pricingRequests);
        Assert.Single(result.Pricings);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-companions-rejected-next-link", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_warns_when_defender_assessment_unhealthy_detail_cap_reached_without_listing_page_cap()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const int unhealthyRows = 4001;
        StringBuilder valueArray = new();
        valueArray.Append('[');

        for (int index = 0; index < unhealthyRows; index++)
        {
            if (index > 0)
            {
                valueArray.Append(',');
            }

            valueArray.Append($$"""
                {
                  "name": "assessment-{{index}}",
                  "properties": {
                    "displayName": "Unhealthy {{index}}",
                    "status": { "code": "Unhealthy" },
                    "metadata": { "severity": "High" },
                    "resourceDetails": {
                      "id": "/subscriptions/{{subscriptionId}}/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa{{index}}"
                    }
                  }
                }
                """);
        }

        valueArray.Append(']');
        string assessmentsBody = $$"""{ "value": {{valueArray}}, "nextLink": null }""";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/assessments", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(assessmentsBody),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(4000, result.Assessments.Count);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-assessments-truncated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_marks_security_contacts_unavailable_when_first_contacts_page_returns_http_404()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.Contains("/securityContacts", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"value":[]}"""),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        HostedAzureArmDefenderSecurityContactRecord contact = Assert.Single(result.SecurityContacts);
        Assert.Equal("Unavailable", contact.CollectionStatus);
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-security-contacts-not-collected", StringComparison.Ordinal));
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-security-contacts.json collection failed; HTTP 404", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_retains_security_contacts_when_follow_up_contacts_page_returns_http_500()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string nextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Security/securityContacts?api-version=2020-01-01&$skiptoken=page-2";
        int contactRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/securityContacts", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref contactRequests);

            if (page == 1)
            {
                string body = $$"""
                    {
                      "value": [
                        {
                          "name": "default",
                          "properties": {
                            "emails": "soc@contoso.com",
                            "alertNotifications": { "state": "On", "minimalSeverity": "High" }
                          }
                        }
                      ],
                      "nextLink": "{{nextLink}}"
                    }
                    """;

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(body),
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(2, contactRequests);
        HostedAzureArmDefenderSecurityContactRecord contact = Assert.Single(result.SecurityContacts);
        Assert.Equal("Collected", contact.CollectionStatus);
        Assert.Contains("soc@contoso.com", contact.Emails, StringComparison.Ordinal);
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-security-contacts.json collection failed; HTTP 500", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_clears_assessments_when_first_assessments_page_returns_http_403()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.Contains("/assessments", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.Forbidden));
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"value":[]}"""),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Empty(result.Assessments);
        Assert.Empty(result.AssessmentCounts);
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-assessments.json collection failed; HTTP 403", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_rejects_defender_secure_scores_next_link_with_pricings_scope()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        string crossScopeNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Security/pricings?api-version=2024-01-01&$skiptoken=leak";
        int secureScoreRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.EndsWith("/secureScores", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            Interlocked.Increment(ref secureScoreRequests);
            string body = $$"""
                {
                  "value": [
                    { "name": "ascScore", "properties": { "score": { "percentage": 0.5 } } }
                  ],
                  "nextLink": "{{crossScopeNextLink}}"
                }
                """;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(1, secureScoreRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-companions-rejected-next-link", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_rejects_defender_secure_scores_next_link_with_secure_score_controls_scope()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        string crossScopeNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Security/secureScores/ascScore/secureScoreControls?api-version=2024-08-01&$skiptoken=leak";
        int secureScoreRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.EndsWith("/secureScores", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            Interlocked.Increment(ref secureScoreRequests);
            string body = $$"""
                {
                  "value": [
                    { "name": "ascScore", "properties": { "score": { "percentage": 0.5 } } }
                  ],
                  "nextLink": "{{crossScopeNextLink}}"
                }
                """;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(1, secureScoreRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-companions-rejected-next-link", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_rejects_defender_security_contacts_next_link_with_assessments_scope()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        string crossScopeNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Security/assessments?api-version=2021-06-01&$skiptoken=leak";
        int contactRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/securityContacts", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            Interlocked.Increment(ref contactRequests);
            string body = $$"""
                {
                  "value": [
                    {
                      "name": "default",
                      "properties": {
                        "emails": "soc@contoso.com",
                        "alertNotifications": { "state": "On", "minimalSeverity": "High" }
                      }
                    }
                  ],
                  "nextLink": "{{crossScopeNextLink}}"
                }
                """;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(1, contactRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-companions-rejected-next-link", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_rejects_defender_security_contacts_next_link_with_role_assignments_scope()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        string crossScopeNextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId}/providers/Microsoft.Authorization/roleAssignments?api-version=2022-04-01&$skiptoken=leak";
        int contactRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/securityContacts", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            Interlocked.Increment(ref contactRequests);
            string body = $$"""
                {
                  "value": [
                    {
                      "name": "default",
                      "properties": {
                        "emails": "soc@contoso.com",
                        "alertNotifications": { "state": "On", "minimalSeverity": "High" }
                      }
                    }
                  ],
                  "nextLink": "{{crossScopeNextLink}}"
                }
                """;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(1, contactRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-companions-rejected-next-link", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderCompanionsAsync_retains_assessments_when_follow_up_assessments_page_returns_http_500()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        string vmId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";
        int assessmentRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.EndsWith("/assessments", StringComparison.OrdinalIgnoreCase)
                || path.Contains("/governanceAssignments", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref assessmentRequests);

            if (page == 1)
            {
                string body = $$"""
                    {
                      "value": [
                        {
                          "name": "assessment-retained",
                          "properties": {
                            "displayName": "Retained assessment",
                            "metadata": { "severity": "High" },
                            "status": { "code": "Unhealthy", "cause": "Test" },
                            "resourceDetails": { "id": "{{vmId}}" }
                          }
                        }
                      ],
                      "nextLink": "https://management.azure.com/subscriptions/{{subscriptionId}}/providers/Microsoft.Security/assessments?api-version=2021-06-01&$skiptoken=page-2"
                    }
                    """;

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(body),
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderCompanionCollectResult result = await client.CollectSubscriptionDefenderCompanionsAsync(
            "token-abc",
            subscriptionId,
            CancellationToken.None);

        Assert.Equal(2, assessmentRequests);
        Assert.Single(result.Assessments);
        Assert.Equal("assessment-retained", result.Assessments[0].AssessmentKey);
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-assessments.json collection failed; HTTP 500", StringComparison.Ordinal));
    }

    private sealed class RecordingHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> responder)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            responder(request, cancellationToken);
    }
}
