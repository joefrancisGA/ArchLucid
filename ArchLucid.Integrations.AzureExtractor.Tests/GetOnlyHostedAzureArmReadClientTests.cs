using System.Net;

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
    public async Task ListSubscriptionResourcesAsync_throws_when_next_link_repeats()
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

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListSubscriptionResourcesAsync(
                "token-abc",
                "11111111-1111-1111-1111-111111111111",
                CancellationToken.None));

        Assert.Contains("repeating nextLink", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(2, requestCount);
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

        Assert.Contains("subscription", exception.Message, StringComparison.OrdinalIgnoreCase);
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

        IReadOnlyList<HostedAzureArmDiagnosticSettingRecord> settings = await client.ListDiagnosticSettingsAsync(
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

        Assert.Single(settings);
        Assert.Equal(storageResourceId, settings[0].TargetResourceId);
        Assert.Equal("diag-to-law", settings[0].Name);
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
    public async Task ListSubscriptionDefenderSummariesAsync_throws_when_next_link_repeats()
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

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListSubscriptionDefenderSummariesAsync(
                "token-abc",
                subscriptionId,
                CancellationToken.None));

        Assert.Contains("repeating nextLink", exception.Message, StringComparison.OrdinalIgnoreCase);
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
