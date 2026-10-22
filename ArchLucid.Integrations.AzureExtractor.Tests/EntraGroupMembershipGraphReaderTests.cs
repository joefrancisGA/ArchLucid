using System.Net;
using System.Text;

using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Integrations.AzureExtractor;

using Azure.Core;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;
using Moq.Protected;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
public sealed class EntraGroupMembershipGraphReaderTests
{
    private const string GroupA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    private const string GroupB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    private const string MemberUser = "cccccccc-cccc-cccc-cccc-cccccccccccc";

    [Fact]
    public async Task TryReadDirectMembershipsAsync_empty_seed_returns_without_http_call()
    {
        Mock<HttpMessageHandler> handler = new();
        HttpClient httpClient = new(handler.Object)
        {
            BaseAddress = new Uri("https://graph.microsoft.com/"),
        };

        EntraGroupMembershipGraphReader sut = new(httpClient, NullLogger<EntraGroupMembershipGraphReader>.Instance);

        EntraGroupMembershipGraphReadResult result = await sut.TryReadDirectMembershipsAsync(
            new StubTokenCredential(),
            [],
            maxNestedDepth: 5,
            CancellationToken.None);

        Assert.Empty(result.Memberships);
        Assert.False(result.Forbidden);
        handler.Protected().Verify(
            "SendAsync",
            Times.Never(),
            ItExpr.IsAny<HttpRequestMessage>(),
            ItExpr.IsAny<CancellationToken>());
    }

    [Fact]
    public async Task TryReadDirectMembershipsAsync_forbidden_returns_warning()
    {
        HttpClient httpClient = CreateHttpClient(_ => new HttpResponseMessage(HttpStatusCode.Forbidden));
        EntraGroupMembershipGraphReader sut = new(httpClient, NullLogger<EntraGroupMembershipGraphReader>.Instance);

        EntraGroupMembershipGraphReadResult result = await sut.TryReadDirectMembershipsAsync(
            new StubTokenCredential(),
            [GroupA],
            maxNestedDepth: 5,
            CancellationToken.None);

        Assert.True(result.Forbidden);
        Assert.Contains(SecurityEvidenceEntraGroupAdapterWarnings.GraphForbidden, result.Warnings);
    }

    [Fact]
    public async Task TryReadDirectMembershipsAsync_retains_members_from_other_groups_when_one_seed_returns_forbidden()
    {
        HttpClient httpClient = CreateHttpClient(request =>
        {
            string groupId = request.RequestUri!.AbsolutePath.Split('/')[3];

            if (groupId.Equals(GroupA, StringComparison.OrdinalIgnoreCase))
            {
                return JsonResponse(
                    $$"""
                    {
                      "value": [
                        {
                          "id": "{{MemberUser}}",
                          "@odata.type": "#microsoft.graph.user"
                        }
                      ]
                    }
                    """);
            }

            if (groupId.Equals(GroupB, StringComparison.OrdinalIgnoreCase))
            {
                return new HttpResponseMessage(HttpStatusCode.Forbidden);
            }

            return new HttpResponseMessage(HttpStatusCode.NotFound);
        });

        EntraGroupMembershipGraphReader sut = new(httpClient, NullLogger<EntraGroupMembershipGraphReader>.Instance);

        EntraGroupMembershipGraphReadResult result = await sut.TryReadDirectMembershipsAsync(
            new StubTokenCredential(),
            [GroupA, GroupB],
            maxNestedDepth: 0,
            CancellationToken.None);

        Assert.False(result.Forbidden);
        Assert.Single(result.Memberships);
        Assert.Contains(result.Memberships, row => row.MemberId == MemberUser && row.GroupId == GroupA);
    }

    [Fact]
    public async Task TryReadDirectMembershipsAsync_follows_odata_next_link_for_group_members()
    {
        const string memberPage1 = "dddddddd-dddd-dddd-dddd-dddddddddddd";
        const string memberPage2 = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
        int requestCount = 0;

        HttpClient httpClient = CreateHttpClient(request =>
        {
            int current = Interlocked.Increment(ref requestCount);

            if (current == 1)
            {
                return JsonResponse(
                    $$"""
                    {
                      "value": [
                        {
                          "id": "{{memberPage1}}",
                          "@odata.type": "#microsoft.graph.user"
                        }
                      ],
                      "@odata.nextLink": "https://graph.microsoft.com/v1.0/groups/{{GroupA}}/members?$select=id&$skiptoken=page2"
                    }
                    """);
            }

            if (current == 2)
            {
                Assert.Contains("/groups/", request.RequestUri!.AbsolutePath, StringComparison.Ordinal);

                return JsonResponse(
                    $$"""
                    {
                      "value": [
                        {
                          "id": "{{memberPage2}}",
                          "@odata.type": "#microsoft.graph.user"
                        }
                      ]
                    }
                    """);
            }

            throw new InvalidOperationException(
                "Test hang guard: Entra group membership listing did not stop after second page.");
        });

        EntraGroupMembershipGraphReader sut = new(httpClient, NullLogger<EntraGroupMembershipGraphReader>.Instance);

        EntraGroupMembershipGraphReadResult result = await sut.TryReadDirectMembershipsAsync(
            new StubTokenCredential(),
            [GroupA],
            maxNestedDepth: 0,
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.Equal(2, result.Memberships.Count);
        Assert.Contains(result.Memberships, row => row.MemberId == memberPage1 && row.GroupId == GroupA);
        Assert.Contains(result.Memberships, row => row.MemberId == memberPage2 && row.GroupId == GroupA);
    }

    [Fact]
    public async Task TryReadDirectMembershipsAsync_retains_first_page_members_when_later_page_returns_forbidden()
    {
        const string memberPage1 = "dddddddd-dddd-dddd-dddd-dddddddddddd";
        int requestCount = 0;

        HttpClient httpClient = CreateHttpClient(request =>
        {
            int current = Interlocked.Increment(ref requestCount);

            if (current == 1)
            {
                return JsonResponse(
                    $$"""
                    {
                      "value": [
                        {
                          "id": "{{memberPage1}}",
                          "@odata.type": "#microsoft.graph.user"
                        }
                      ],
                      "@odata.nextLink": "https://graph.microsoft.com/v1.0/groups/{{GroupA}}/members?$select=id&$skiptoken=page2"
                    }
                    """);
            }

            return new HttpResponseMessage(HttpStatusCode.Forbidden);
        });

        EntraGroupMembershipGraphReader sut = new(httpClient, NullLogger<EntraGroupMembershipGraphReader>.Instance);

        EntraGroupMembershipGraphReadResult result = await sut.TryReadDirectMembershipsAsync(
            new StubTokenCredential(),
            [GroupA],
            maxNestedDepth: 0,
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.False(result.Forbidden);
        Assert.Single(result.Memberships);
        Assert.Contains(result.Memberships, row => row.MemberId == memberPage1 && row.GroupId == GroupA);
    }

    [Fact]
    public async Task TryReadDirectMembershipsAsync_retains_first_page_members_when_later_page_fails()
    {
        const string memberPage1 = "dddddddd-dddd-dddd-dddd-dddddddddddd";
        int requestCount = 0;

        HttpClient httpClient = CreateHttpClient(request =>
        {
            int current = Interlocked.Increment(ref requestCount);

            if (current == 1)
            {
                return JsonResponse(
                    $$"""
                    {
                      "value": [
                        {
                          "id": "{{memberPage1}}",
                          "@odata.type": "#microsoft.graph.user"
                        }
                      ],
                      "@odata.nextLink": "https://graph.microsoft.com/v1.0/groups/{{GroupA}}/members?$select=id&$skiptoken=page2"
                    }
                    """);
            }

            if (current == 2)
            {
                return new HttpResponseMessage(HttpStatusCode.InternalServerError)
                {
                    Content = new StringContent("""{"error":{"code":"generalException"}}""", Encoding.UTF8, "application/json"),
                };
            }

            throw new InvalidOperationException("unexpected page");
        });

        EntraGroupMembershipGraphReader sut = new(httpClient, NullLogger<EntraGroupMembershipGraphReader>.Instance);

        EntraGroupMembershipGraphReadResult result = await sut.TryReadDirectMembershipsAsync(
            new StubTokenCredential(),
            [GroupA],
            maxNestedDepth: 0,
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.Single(result.Memberships);
        Assert.Contains(result.Memberships, row => row.MemberId == memberPage1 && row.GroupId == GroupA);
    }

    [Fact]
    public async Task TryReadDirectMembershipsAsync_retains_collected_members_when_next_link_validation_fails_after_a_successful_page()
    {
        const string memberPage1 = "dddddddd-dddd-dddd-dddd-dddddddddddd";
        const string memberPage2 = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
        const string leakedMember = "ffffffff-ffff-ffff-ffff-ffffffffffff";
        int requestCount = 0;

        HttpClient httpClient = CreateHttpClient(request =>
        {
            int current = Interlocked.Increment(ref requestCount);

            if (current == 1)
            {
                return JsonResponse(
                    $$"""
                    {
                      "value": [
                        {
                          "id": "{{memberPage1}}",
                          "@odata.type": "#microsoft.graph.user"
                        }
                      ],
                      "@odata.nextLink": "https://graph.microsoft.com/v1.0/groups/{{GroupA}}/members?$select=id&$skiptoken=page2"
                    }
                    """);
            }

            if (current == 2)
            {
                return JsonResponse(
                    $$"""
                    {
                      "value": [
                        {
                          "id": "{{memberPage2}}",
                          "@odata.type": "#microsoft.graph.user"
                        }
                      ],
                      "@odata.nextLink": "https://graph.microsoft.com/v1.0/groups/{{GroupB}}/members?$select=id&$skiptoken=leak"
                    }
                    """);
            }

            return JsonResponse(
                $$"""
                {
                  "value": [
                    {
                      "id": "{{leakedMember}}",
                      "@odata.type": "#microsoft.graph.user"
                    }
                  ]
                }
                """);
        });

        EntraGroupMembershipGraphReader sut = new(httpClient, NullLogger<EntraGroupMembershipGraphReader>.Instance);

        EntraGroupMembershipGraphReadResult result = await sut.TryReadDirectMembershipsAsync(
            new StubTokenCredential(),
            [GroupA],
            maxNestedDepth: 0,
            CancellationToken.None);

        Assert.Equal(2, requestCount);
        Assert.Equal(2, result.Memberships.Count);
        Assert.Contains(result.Memberships, row => row.MemberId == memberPage1 && row.GroupId == GroupA);
        Assert.Contains(result.Memberships, row => row.MemberId == memberPage2 && row.GroupId == GroupA);
        Assert.DoesNotContain(result.Memberships, row => row.MemberId == leakedMember);
    }

    [Fact]
    public async Task TryReadDirectMembershipsAsync_rejects_odata_next_link_for_different_group()
    {
        const string leakedMember = "ffffffff-ffff-ffff-ffff-ffffffffffff";
        int requestCount = 0;

        HttpClient httpClient = CreateHttpClient(request =>
        {
            int current = Interlocked.Increment(ref requestCount);

            if (current == 1)
            {
                return JsonResponse(
                    $$"""
                    {
                      "value": [
                        {
                          "id": "{{MemberUser}}",
                          "@odata.type": "#microsoft.graph.user"
                        }
                      ],
                      "@odata.nextLink": "https://graph.microsoft.com/v1.0/groups/{{GroupB}}/members?$select=id&$skiptoken=leak"
                    }
                    """);
            }

            return JsonResponse(
                $$"""
                {
                  "value": [
                    {
                      "id": "{{leakedMember}}",
                      "@odata.type": "#microsoft.graph.user"
                    }
                  ]
                }
                """);
        });

        EntraGroupMembershipGraphReader sut = new(httpClient, NullLogger<EntraGroupMembershipGraphReader>.Instance);

        EntraGroupMembershipGraphReadResult result = await sut.TryReadDirectMembershipsAsync(
            new StubTokenCredential(),
            [GroupA],
            maxNestedDepth: 0,
            CancellationToken.None);

        Assert.Equal(1, requestCount);
        Assert.Single(result.Memberships);
        Assert.Contains(result.Memberships, row => row.MemberId == MemberUser && row.GroupId == GroupA);
        Assert.DoesNotContain(result.Memberships, row => row.MemberId == leakedMember);
    }

    [Fact]
    public async Task TryReadDirectMembershipsAsync_rejects_odata_next_link_for_different_group_collection()
    {
        const string leakedOwner = "ffffffff-ffff-ffff-ffff-ffffffffffff";
        int requestCount = 0;

        HttpClient httpClient = CreateHttpClient(request =>
        {
            int current = Interlocked.Increment(ref requestCount);

            if (current == 1)
            {
                return JsonResponse(
                    $$"""
                    {
                      "value": [
                        {
                          "id": "{{MemberUser}}",
                          "@odata.type": "#microsoft.graph.user"
                        }
                      ],
                      "@odata.nextLink": "https://graph.microsoft.com/v1.0/groups/{{GroupA}}/owners?$select=id&$skiptoken=leak"
                    }
                    """);
            }

            return JsonResponse(
                $$"""
                {
                  "value": [
                    {
                      "id": "{{leakedOwner}}",
                      "@odata.type": "#microsoft.graph.user"
                    }
                  ]
                }
                """);
        });

        EntraGroupMembershipGraphReader sut = new(httpClient, NullLogger<EntraGroupMembershipGraphReader>.Instance);

        EntraGroupMembershipGraphReadResult result = await sut.TryReadDirectMembershipsAsync(
            new StubTokenCredential(),
            [GroupA],
            maxNestedDepth: 0,
            CancellationToken.None);

        Assert.Equal(1, requestCount);
        Assert.Single(result.Memberships);
        Assert.Contains(result.Memberships, row => row.MemberId == MemberUser && row.GroupId == GroupA);
        Assert.DoesNotContain(result.Memberships, row => row.MemberId == leakedOwner);
    }

    [Fact]
    public async Task TryReadDirectMembershipsAsync_rejects_odata_next_link_for_members_sub_path()
    {
        HttpClient httpClient = CreateHttpClient(_ => JsonResponse(
            $$"""
            {
              "value": [
                {
                  "id": "{{MemberUser}}",
                  "@odata.type": "#microsoft.graph.user"
                }
              ],
              "@odata.nextLink": "https://graph.microsoft.com/v1.0/groups/{{GroupA}}/members/owners?$select=id&$skiptoken=leak"
            }
            """));

        EntraGroupMembershipGraphReader sut = new(httpClient, NullLogger<EntraGroupMembershipGraphReader>.Instance);

        EntraGroupMembershipGraphReadResult result = await sut.TryReadDirectMembershipsAsync(
            new StubTokenCredential(),
            [GroupA],
            maxNestedDepth: 0,
            CancellationToken.None);

        Assert.Single(result.Memberships);
        Assert.Contains(result.Memberships, row => row.MemberId == MemberUser && row.GroupId == GroupA);
    }

    [Fact]
    public async Task TryReadDirectMembershipsAsync_rejects_odata_next_link_on_untrusted_host()
    {
        HttpClient httpClient = CreateHttpClient(_ => JsonResponse(
            $$"""
            {
              "value": [
                {
                  "id": "{{MemberUser}}",
                  "@odata.type": "#microsoft.graph.user"
                }
              ],
              "@odata.nextLink": "https://evil.example.com/v1.0/groups/{{GroupA}}/members?$select=id&$skiptoken=leak"
            }
            """));

        EntraGroupMembershipGraphReader sut = new(httpClient, NullLogger<EntraGroupMembershipGraphReader>.Instance);

        EntraGroupMembershipGraphReadResult result = await sut.TryReadDirectMembershipsAsync(
            new StubTokenCredential(),
            [GroupA],
            maxNestedDepth: 0,
            CancellationToken.None);

        Assert.Single(result.Memberships);
        Assert.Contains(result.Memberships, row => row.MemberId == MemberUser && row.GroupId == GroupA);
    }

    [Fact]
    public async Task TryReadDirectMembershipsAsync_rejects_odata_next_link_without_https()
    {
        HttpClient httpClient = CreateHttpClient(_ => JsonResponse(
            $$"""
            {
              "value": [
                {
                  "id": "{{MemberUser}}",
                  "@odata.type": "#microsoft.graph.user"
                }
              ],
              "@odata.nextLink": "http://graph.microsoft.com/v1.0/groups/{{GroupA}}/members?$select=id&$skiptoken=leak"
            }
            """));

        EntraGroupMembershipGraphReader sut = new(httpClient, NullLogger<EntraGroupMembershipGraphReader>.Instance);

        EntraGroupMembershipGraphReadResult result = await sut.TryReadDirectMembershipsAsync(
            new StubTokenCredential(),
            [GroupA],
            maxNestedDepth: 0,
            CancellationToken.None);

        Assert.Single(result.Memberships);
        Assert.Contains(result.Memberships, row => row.MemberId == MemberUser && row.GroupId == GroupA);
    }

    [Fact]
    public async Task TryReadDirectMembershipsAsync_rejects_invalid_odata_next_link_url()
    {
        HttpClient httpClient = CreateHttpClient(_ => JsonResponse(
            """
            {
              "value": [],
              "@odata.nextLink": "not-a-valid-url"
            }
            """));

        EntraGroupMembershipGraphReader sut = new(httpClient, NullLogger<EntraGroupMembershipGraphReader>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.TryReadDirectMembershipsAsync(
                new StubTokenCredential(),
                [GroupA],
                maxNestedDepth: 0,
                CancellationToken.None));

        Assert.Contains("invalid @odata.nextLink", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task TryReadDirectMembershipsAsync_retains_members_when_next_link_url_is_invalid_on_an_otherwise_populated_page()
    {
        HttpClient httpClient = CreateHttpClient(_ => JsonResponse(
            """
            {
              "value": [
                {
                  "id": "dddddddd-dddd-dddd-dddd-dddddddddddd",
                  "@odata.type": "#microsoft.graph.user"
                }
              ],
              "@odata.nextLink": "not-a-valid-url"
            }
            """));

        EntraGroupMembershipGraphReader sut = new(httpClient, NullLogger<EntraGroupMembershipGraphReader>.Instance);

        EntraGroupMembershipGraphReadResult result = await sut.TryReadDirectMembershipsAsync(
            new StubTokenCredential(),
            [GroupA],
            maxNestedDepth: 0,
            CancellationToken.None);

        Assert.Single(result.Memberships);
        Assert.Equal("dddddddd-dddd-dddd-dddd-dddddddddddd", result.Memberships[0].MemberId);
    }

    [Fact]
    public async Task TryReadDirectMembershipsAsync_respects_nested_depth_cap()
    {
        List<string> requestedGroupIds = [];
        HttpClient httpClient = CreateHttpClient(request =>
        {
            string groupId = request.RequestUri!.AbsolutePath.Split('/')[3];
            requestedGroupIds.Add(groupId);

            if (groupId.Equals(GroupA, StringComparison.OrdinalIgnoreCase))
            {
                return JsonResponse(
                    $$"""
                    {
                      "value": [
                        {
                          "id": "{{GroupB}}",
                          "@odata.type": "#microsoft.graph.group"
                        }
                      ]
                    }
                    """);
            }

            return JsonResponse(
                $$"""
                {
                  "value": [
                    {
                      "id": "{{MemberUser}}",
                      "@odata.type": "#microsoft.graph.user"
                    }
                  ]
                }
                """);
        });

        EntraGroupMembershipGraphReader sut = new(httpClient, NullLogger<EntraGroupMembershipGraphReader>.Instance);

        EntraGroupMembershipGraphReadResult shallow = await sut.TryReadDirectMembershipsAsync(
            new StubTokenCredential(),
            [GroupA],
            maxNestedDepth: 0,
            CancellationToken.None);

        Assert.Single(requestedGroupIds);
        Assert.Single(shallow.Memberships);
        Assert.Equal(GroupB, shallow.Memberships[0].MemberId);
        Assert.Equal(GroupA, shallow.Memberships[0].GroupId);

        requestedGroupIds.Clear();

        EntraGroupMembershipGraphReadResult deep = await sut.TryReadDirectMembershipsAsync(
            new StubTokenCredential(),
            [GroupA],
            maxNestedDepth: 1,
            CancellationToken.None);

        Assert.Equal(2, requestedGroupIds.Count);
        Assert.Equal(2, deep.Memberships.Count);
        Assert.Contains(deep.Memberships, row => row.MemberId == MemberUser && row.GroupId == GroupB);
    }

    [Fact]
    public async Task TryReadDirectMembershipsAsync_does_not_expand_members_with_group_substring_odata_types()
    {
        const string lifecyclePolicyMember = "dddddddd-dddd-dddd-dddd-dddddddddddd";
        int requestCount = 0;

        HttpClient httpClient = CreateHttpClient(request =>
        {
            Interlocked.Increment(ref requestCount);

            return JsonResponse(
                $$"""
                {
                  "value": [
                    {
                      "id": "{{lifecyclePolicyMember}}",
                      "@odata.type": "#microsoft.graph.groupLifecyclePolicy"
                    }
                  ]
                }
                """);
        });

        EntraGroupMembershipGraphReader sut = new(httpClient, NullLogger<EntraGroupMembershipGraphReader>.Instance);

        EntraGroupMembershipGraphReadResult result = await sut.TryReadDirectMembershipsAsync(
            new StubTokenCredential(),
            [GroupA],
            maxNestedDepth: 1,
            CancellationToken.None);

        Assert.Equal(1, requestCount);
        Assert.Single(result.Memberships);
        Assert.Equal(lifecyclePolicyMember, result.Memberships[0].MemberId);
        Assert.Equal(GroupA, result.Memberships[0].GroupId);
    }

    [Fact]
    public async Task CollectZipAsync_graph_disabled_does_not_call_graph_reader()
    {
        Mock<IHostedAzureExtractorCredentialFactory> credentialFactory = new();
        credentialFactory
            .Setup(f => f.CreateCredential(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(new StubTokenCredential());

        Mock<IHostedAzureArmReadClient> armClient = new();
        armClient
            .Setup(c => c.ListSubscriptionResourcesAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        armClient
            .Setup(c => c.ListSubscriptionRoleAssignmentsAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        armClient
            .Setup(c => c.ListSubscriptionRoleEligibilitySchedulesAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        armClient
            .Setup(c => c.ListFederatedCredentialsAsync(
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<HostedAzureArmResourceRecord>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        ConfigureHostedExtractorArmClientMocks(armClient);

        Mock<IEntraGroupMembershipGraphReader> graphReader = new();

        Mock<IOptionsMonitor<EntraGroupMembershipGraphOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EntraGroupMembershipGraphOptions { Enabled = false });

        (Mock<IEntraAddCredentialGraphReader> addCredentialGraphReader, Mock<IOptionsMonitor<EntraAddCredentialGraphOptions>> addCredentialGraphOptions) =
            HostedAzureExtractorGraphTestSupport.CreateAddCredentialGraphMocks();

        HostedAzureExtractorClient sut = new(
            credentialFactory.Object,
            armClient.Object,
            CreatePostReadClientMock().Object,
            graphReader.Object,
            options.Object,
            addCredentialGraphReader.Object,
            addCredentialGraphOptions.Object,
            NullLogger<HostedAzureExtractorClient>.Instance);

        await sut.CollectZipAsync(
            new HostedAzureExtractorCollectionRequest
            {
                CustomerTenantId = "22222222-2222-2222-2222-222222222222",
                CustomerAppId = "33333333-3333-3333-3333-333333333333",
                SubscriptionId = "11111111-1111-1111-1111-111111111111",
            },
            CancellationToken.None);

        graphReader.Verify(
            reader => reader.TryReadDirectMembershipsAsync(
                It.IsAny<TokenCredential>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CollectZipAsync_graph_enabled_seeds_group_principals_from_role_assignments()
    {
        Mock<IHostedAzureExtractorCredentialFactory> credentialFactory = new();
        credentialFactory
            .Setup(f => f.CreateCredential(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(new StubTokenCredential());

        const string groupId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

        Mock<IHostedAzureArmReadClient> armClient = new();
        armClient
            .Setup(c => c.ListSubscriptionResourcesAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        armClient
            .Setup(c => c.ListSubscriptionRoleAssignmentsAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new HostedAzureArmRoleAssignmentRecord(
                    "/subscriptions/sub",
                    groupId,
                    "Group",
                    "/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c"),
            ]);

        armClient
            .Setup(c => c.ListSubscriptionRoleEligibilitySchedulesAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        ConfigureHostedExtractorArmClientMocks(armClient);

        IReadOnlyList<string>? capturedSeedGroupIds = null;

        Mock<IEntraGroupMembershipGraphReader> graphReader = new();
        graphReader
            .Setup(reader => reader.TryReadDirectMembershipsAsync(
                It.IsAny<TokenCredential>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .Callback<TokenCredential, IReadOnlyList<string>, int, CancellationToken>(
                (_, seedGroupIds, _, _) => capturedSeedGroupIds = seedGroupIds)
            .ReturnsAsync(EntraGroupMembershipGraphReadResult.Empty());

        Mock<IOptionsMonitor<EntraGroupMembershipGraphOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new EntraGroupMembershipGraphOptions { Enabled = true });

        (Mock<IEntraAddCredentialGraphReader> addCredentialGraphReader, Mock<IOptionsMonitor<EntraAddCredentialGraphOptions>> addCredentialGraphOptions) =
            HostedAzureExtractorGraphTestSupport.CreateAddCredentialGraphMocks();

        HostedAzureExtractorClient sut = new(
            credentialFactory.Object,
            armClient.Object,
            CreatePostReadClientMock().Object,
            graphReader.Object,
            options.Object,
            addCredentialGraphReader.Object,
            addCredentialGraphOptions.Object,
            NullLogger<HostedAzureExtractorClient>.Instance);

        await sut.CollectZipAsync(
            new HostedAzureExtractorCollectionRequest
            {
                CustomerTenantId = "22222222-2222-2222-2222-222222222222",
                CustomerAppId = "33333333-3333-3333-3333-333333333333",
                SubscriptionId = "11111111-1111-1111-1111-111111111111",
            },
            CancellationToken.None);

        Assert.NotNull(capturedSeedGroupIds);
        Assert.Single(capturedSeedGroupIds!);
        Assert.Equal(groupId, capturedSeedGroupIds![0]);
    }

    private static void ConfigureHostedExtractorArmClientMocks(Mock<IHostedAzureArmReadClient> armClient)
    {
        armClient
            .Setup(c => c.TryGetSubscriptionDisplayNameAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        armClient
            .Setup(c => c.ListSubscriptionPolicyAssignmentsAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        armClient
            .Setup(c => c.ListDiagnosticSettingsAsync(
                It.IsAny<string>(),
                It.IsAny<IReadOnlyList<HostedAzureArmResourceRecord>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HostedAzureDiagnosticSettingsCollectResult());

        armClient
            .Setup(c => c.ListSubscriptionDefenderSummariesAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        armClient
            .Setup(c => c.ListBuiltInPolicyDefinitionDocumentsAsync(
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        armClient
            .Setup(c => c.ListSubscriptionPolicyDefinitionDocumentsAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        armClient
            .Setup(c => c.ListSubscriptionPolicyAssignmentDocumentsAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
    }

    private static Mock<IHostedAzureManagementPostReadClient> CreatePostReadClientMock()
    {
        Mock<IHostedAzureManagementPostReadClient> postClient = new();

        postClient
            .Setup(c => c.TryQueryActualCostSummaryAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((HostedAzureActualCostSummary?)null);

        postClient
            .Setup(c => c.QueryPolicyComplianceAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HostedAzurePolicyComplianceDocument
            {
                CollectionTimestampUtc = "2026-05-21T12:00:00Z",
                Scope = "/subscriptions/11111111-1111-1111-1111-111111111111",
                RecordCount = 0,
                Records = [],
            });

        return postClient;
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
            new("token", DateTimeOffset.UtcNow.AddHours(1));

        public override ValueTask<AccessToken> GetTokenAsync(
            TokenRequestContext requestContext,
            CancellationToken cancellationToken) =>
            new(GetToken(requestContext, cancellationToken));
    }
}
