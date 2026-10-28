using System.Net;
using System.Text;
using System.Text.Json;
using System.Threading;

using Microsoft.Extensions.Logging.Abstractions;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
public sealed class GetOnlyHostedAzureArmReadClientDefenderFollowOnTests
{
    private const string SubscriptionId = "11111111-1111-1111-1111-111111111111";

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_maps_governance_compliance_alerts_paths_and_vulnerabilities()
    {
        string storageId = $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        string vmId = $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";
        int controlCalls = 0;
        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;
            string body = path switch
            {
                _ when path.Contains("/governanceAssignments", StringComparison.Ordinal) =>
                    "{\"value\":[{\"id\":\"" + storageId + "/providers/Microsoft.Security/assessments/key-1/governanceAssignments/g1\",\"name\":\"g1\",\"properties\":{\"owner\":\"soc@contoso.com\",\"remediationDueDate\":\"2026-11-01T00:00:00Z\",\"isGracePeriod\":true}}]}",
                _ when path.Contains("/regulatoryComplianceControls", StringComparison.Ordinal) =>
                    Count(ref controlCalls, """{"value":[{"name":"failed-control","properties":{"state":"Failed","failedAssessments":2}},{"name":"passed-control","properties":{"state":"Passed","failedAssessments":0}}]}"""),
                _ when path.Contains("/regulatoryComplianceStandards", StringComparison.Ordinal) =>
                    """{"value":[{"name":"Azure-CIS","properties":{"state":"Failed","passedControls":4,"failedControls":2,"skippedControls":1}},{"name":"Passed-Standard","properties":{"state":"Passed","passedControls":3,"failedControls":0,"skippedControls":0}}]}""",
                _ when path.Contains("/alerts", StringComparison.Ordinal) =>
                    "{\"value\":[{\"name\":\"alert-1\",\"properties\":{\"alertDisplayName\":\"Open alert\",\"severity\":\"Critical\",\"status\":\"Active\",\"intent\":\"Execution\",\"alertType\":\"VM_EICAR\",\"startTimeUtc\":\"2026-10-01T00:00:00Z\",\"entities\":[{\"commandLine\":\"powershell.exe -enc SECRET\"}],\"resourceIdentifiers\":[{\"type\":\"AzureResource\",\"azureResourceId\":\"" + vmId + "\"},{\"type\":\"LogAnalytics\",\"agentId\":\"agent\"}]}},{\"name\":\"alert-resolved\",\"properties\":{\"status\":\"Resolved\",\"severity\":\"High\",\"alertDisplayName\":\"Closed\"}}]}",
                _ when path.Contains("/attackPaths", StringComparison.Ordinal) =>
                    "{\"value\":[{\"name\":\"path-1\",\"properties\":{\"displayName\":\"Internet to storage\",\"description\":\"DO_NOT_STORE_DESCRIPTION\",\"manualRemediationSteps\":[\"rotate\"],\"riskLevel\":\"High\",\"entryPointEntityInformation\":{\"azureResourceId\":\"" + vmId + "\"},\"targetEntityInformation\":{\"azureResourceId\":\"" + storageId + "\"}}},{\"name\":\"empty-path\",\"properties\":{\"displayName\":\"No endpoints\",\"riskLevel\":\"Low\"}}]}",
                _ when path.Contains("/subAssessments", StringComparison.Ordinal) =>
                    "{\"value\":[{\"name\":\"finding-1\",\"properties\":{\"displayName\":\"OpenSSL\",\"description\":\"DO_NOT_STORE_VULN_DESCRIPTION\",\"status\":{\"severity\":\"High\"},\"resourceDetails\":{\"id\":\"" + vmId + "\"},\"additionalData\":{\"cve\":[{\"title\":\"CVE-2024-9999\"}]}}},{\"name\":\"finding-2\",\"properties\":{\"displayName\":\"Kernel\",\"status\":{\"severity\":\"High\"},\"resourceDetails\":{\"id\":\"" + vmId + "\"},\"id\":\"VA2\"}},{\"name\":\"finding-3\",\"properties\":{\"displayName\":\"Info\",\"description\":\"DO_NOT_STORE_VULN_DESCRIPTION\",\"status\":{\"severity\":\"Medium\"},\"resourceDetails\":{\"id\":\"" + vmId + "\"}}}]}",
                _ => """{"value":[]}""",
            };

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });
        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        HostedAzureArmDefenderGovernanceRecord governance = Assert.Single(result.GovernanceAssignments);
        Assert.Equal("soc@contoso.com", governance.Owner);
        Assert.Equal("key-1", governance.AssessmentKey);
        Assert.Equal(storageId.ToLowerInvariant(), governance.ResourceId);
        Assert.Equal(new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc), governance.RemediationDueUtc);
        Assert.True(governance.IsGracePeriod);
        Assert.Equal(2, result.ComplianceStandards.Count);
        Assert.Equal(2, result.ComplianceStandards[0].FailedControlCount);
        HostedAzureArmDefenderComplianceControlRecord control = Assert.Single(result.ComplianceControls);
        Assert.Equal("failed-control", control.ControlName);
        Assert.Equal(1, controlCalls);
        HostedAzureArmDefenderAlertRecord alert = Assert.Single(result.Alerts);
        Assert.Equal("High", alert.Severity);
        Assert.Equal(vmId.ToLowerInvariant(), alert.ResourceId);
        Assert.DoesNotContain("SECRET", JsonSerializer.Serialize(alert), StringComparison.Ordinal);
        HostedAzureArmDefenderAttackPathRecord attackPath = Assert.Single(result.AttackPaths);
        Assert.Equal(vmId.ToLowerInvariant(), attackPath.EntryResourceIds);
        Assert.Equal(storageId.ToLowerInvariant(), attackPath.TargetResourceIds);
        Assert.DoesNotContain("DO_NOT_STORE_DESCRIPTION", JsonSerializer.Serialize(attackPath), StringComparison.Ordinal);
        HostedAzureArmDefenderVulnerabilityCountRecord counts = Assert.Single(result.VulnerabilityCounts);
        Assert.Equal(2, counts.HighCount);
        Assert.Equal(1, counts.MediumCount);
        Assert.Equal(2, result.VulnerabilityFindings.Count);
        Assert.Contains(result.VulnerabilityFindings, finding => finding.FindingId == "CVE-2024-9999");
        Assert.DoesNotContain("DO_NOT_STORE_VULN_DESCRIPTION", JsonSerializer.Serialize(result.VulnerabilityFindings), StringComparison.Ordinal);
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_skips_attack_paths_when_cspm_is_free()
    {
        int attackCalls = 0;
        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            if ((request.RequestUri?.AbsolutePath ?? string.Empty).Contains("/attackPaths", StringComparison.Ordinal))
            {
                attackCalls++;
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"value":[]}"""),
            });
        });
        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            [
                new HostedAzureArmDefenderPricingRecord { SubscriptionId = SubscriptionId, PricingName = "CloudPosture", Tier = "Free" },
                new HostedAzureArmDefenderPricingRecord { SubscriptionId = SubscriptionId, PricingName = "DefenderCspm", Tier = "Free" },
            ],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(0, attackCalls);
        Assert.Empty(result.AttackPaths);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-attack-paths-skipped-plan-off", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_retains_governance_when_assessment_walk_follow_up_returns_http_500()
    {
        string storageId = $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.Contains("/governanceAssignments", StringComparison.Ordinal)
                && !path.Contains("/assessments/", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
            }

            if (path.Contains("/assessments/key-1/governanceAssignments", StringComparison.Ordinal))
            {
                string body =
                    "{\"value\":[{\"id\":\""
                    + storageId
                    + "/providers/Microsoft.Security/assessments/key-1/governanceAssignments/g1\",\"name\":\"g1\",\"properties\":{\"owner\":\"soc@contoso.com\",\"remediationDueDate\":\"2026-11-01T00:00:00Z\",\"isGracePeriod\":false}}]}";

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(body),
                });
            }

            if (path.Contains("/assessments/key-2/governanceAssignments", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"value":[]}"""),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: ["key-1", "key-2"],
            CancellationToken.None);

        HostedAzureArmDefenderGovernanceRecord governance = Assert.Single(result.GovernanceAssignments);
        Assert.Equal("key-1", governance.AssessmentKey);
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_uses_assessment_walk_when_subscription_governance_returns_http_404()
    {
        string storageId = $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.Contains("/governanceAssignments", StringComparison.Ordinal)
                && !path.Contains("/assessments/", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
            }

            if (path.Contains("/assessments/key-1/governanceAssignments", StringComparison.Ordinal))
            {
                string body =
                    "{\"value\":[{\"id\":\""
                    + storageId
                    + "/providers/Microsoft.Security/assessments/key-1/governanceAssignments/g1\",\"name\":\"g1\",\"properties\":{\"owner\":\"soc@contoso.com\",\"remediationDueDate\":\"2026-11-01T00:00:00Z\",\"isGracePeriod\":false}}]}";

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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: ["key-1"],
            CancellationToken.None);

        HostedAzureArmDefenderGovernanceRecord governance = Assert.Single(result.GovernanceAssignments);
        Assert.Equal("key-1", governance.AssessmentKey);
        Assert.DoesNotContain(
            result.Warnings,
            warning => warning.Contains("defender-governance-truncated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_warns_when_defender_compliance_controls_pagination_hits_page_cap()
    {
        int controlRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.EndsWith("/regulatoryComplianceStandards", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        """
                        {"value":[{"name":"Azure-CIS","properties":{"state":"Failed","passedControls":0,"failedControls":1,"skippedControls":0}}]}
                        """),
                });
            }

            if (!path.Contains("/regulatoryComplianceControls", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref controlRequests);
            string? nextLink = page <= 64
                ? $"https://management.azure.com/subscriptions/{SubscriptionId}/providers/Microsoft.Security/regulatoryComplianceStandards/Azure-CIS/regulatoryComplianceControls?api-version=2019-01-01-preview&$skiptoken=page-{page}"
                : null;
            string nextLinkJson = nextLink is null ? "null" : $"\"{nextLink}\"";

            string body = $$"""
                {
                  "value": [
                    {
                      "name": "control-{{page}}",
                      "properties": { "state": "Failed", "failedAssessments": 1 }
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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(64, controlRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-compliance-truncated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_warns_when_defender_governance_assignments_pagination_hits_page_cap()
    {
        string storageId = $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        int governanceRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/governanceAssignments", StringComparison.Ordinal)
                || path.Contains("/assessments/", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref governanceRequests);
            string? nextLink = page <= 64
                ? $"https://management.azure.com/subscriptions/{SubscriptionId}/providers/Microsoft.Security/governanceAssignments?api-version=2022-01-01-preview&$skiptoken=page-{page}"
                : null;
            string nextLinkJson = nextLink is null ? "null" : $"\"{nextLink}\"";

            string body = $$"""
                {
                  "value": [
                    {
                      "id": "{{storageId}}/providers/Microsoft.Security/assessments/key-{{page}}/governanceAssignments/g{{page}}",
                      "name": "g{{page}}",
                      "properties": {
                        "owner": "soc@contoso.com",
                        "remediationDueDate": "2026-11-01T00:00:00Z",
                        "isGracePeriod": false
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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(64, governanceRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-governance-truncated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_retains_governance_when_follow_up_subscription_governance_page_returns_http_500()
    {
        string storageId = $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        int governanceRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/governanceAssignments", StringComparison.Ordinal)
                || path.Contains("/assessments/", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref governanceRequests);

            if (page == 1)
            {
                string body = $$"""
                    {
                      "value": [
                        {
                          "id": "{{storageId}}/providers/Microsoft.Security/assessments/key-1/governanceAssignments/g1",
                          "name": "g1",
                          "properties": {
                            "owner": "soc@contoso.com",
                            "remediationDueDate": "2026-11-01T00:00:00Z",
                            "isGracePeriod": false
                          }
                        }
                      ],
                      "nextLink": "https://management.azure.com/subscriptions/{{SubscriptionId}}/providers/Microsoft.Security/governanceAssignments?api-version=2022-01-01-preview&$skiptoken=page-2"
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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(2, governanceRequests);
        Assert.Single(result.GovernanceAssignments);
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-governance.json collection failed; HTTP 500", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_retains_compliance_standards_when_follow_up_standards_page_returns_http_500()
    {
        const string nextLink =
            $"https://management.azure.com/subscriptions/{SubscriptionId}/providers/Microsoft.Security/regulatoryComplianceStandards?api-version=2019-01-01-preview&$skiptoken=page-2";
        int standardsRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/regulatoryComplianceStandards", StringComparison.Ordinal)
                || path.Contains("/regulatoryComplianceControls", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref standardsRequests);

            if (page == 1)
            {
                string body = $$"""
                    {
                      "value": [
                        {
                          "name": "Azure-CIS",
                          "properties": {
                            "state": "Failed",
                            "passedControls": 1,
                            "failedControls": 2,
                            "skippedControls": 0
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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(2, standardsRequests);
        Assert.Single(result.ComplianceStandards);
        Assert.Equal("Azure-CIS", result.ComplianceStandards[0].StandardName);
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-compliance-standards.json collection failed; HTTP 500", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_retains_compliance_controls_when_follow_up_standards_page_returns_http_500()
    {
        const string nextLink =
            $"https://management.azure.com/subscriptions/{SubscriptionId}/providers/Microsoft.Security/regulatoryComplianceStandards?api-version=2019-01-01-preview&$skiptoken=page-2";
        int standardsRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.Contains("/regulatoryComplianceControls", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        """
                        {
                          "value": [
                            {
                              "name": "control-after-partial-standards",
                              "properties": { "state": "Failed" }
                            }
                          ]
                        }
                        """),
                });
            }

            if (!path.Contains("/regulatoryComplianceStandards", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref standardsRequests);

            if (page == 1)
            {
                string body = $$"""
                    {
                      "value": [
                        {
                          "name": "Azure-CIS",
                          "properties": {
                            "state": "Failed",
                            "passedControls": 0,
                            "failedControls": 1,
                            "skippedControls": 0
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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Single(result.ComplianceStandards);
        Assert.Single(result.ComplianceControls);
        Assert.Equal("control-after-partial-standards", result.ComplianceControls[0].ControlName);
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_collects_attack_paths_when_defender_cspm_is_standard_even_if_cloud_posture_is_free()
    {
        int attackCalls = 0;
        string vmId = $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.Contains("/attackPaths", StringComparison.Ordinal))
            {
                attackCalls++;
                string body =
                    "{\"value\":[{\"name\":\"path-1\",\"properties\":{\"displayName\":\"Path\",\"riskLevel\":\"High\",\"entryPointEntityInformation\":{\"azureResourceId\":\""
                    + vmId
                    + "\"},\"targetEntityInformation\":{\"azureResourceId\":\""
                    + vmId
                    + "\"}}}]}";

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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            [
                new HostedAzureArmDefenderPricingRecord { SubscriptionId = SubscriptionId, PricingName = "CloudPosture", Tier = "Free" },
                new HostedAzureArmDefenderPricingRecord { SubscriptionId = SubscriptionId, PricingName = "DefenderCspm", Tier = "Standard" },
            ],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(1, attackCalls);
        Assert.Single(result.AttackPaths);
        Assert.DoesNotContain(
            result.Warnings,
            warning => warning.Contains("defender-attack-paths-skipped-plan-off", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_warns_when_defender_vulnerability_finding_row_cap_reached_without_listing_page_cap()
    {
        string vmId = $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";
        StringBuilder valueArray = new();
        valueArray.Append('[');

        for (int index = 0; index < 1001; index++)
        {
            if (index > 0)
            {
                valueArray.Append(',');
            }

            valueArray.Append($$"""
                {
                  "name": "finding-{{index}}",
                  "properties": {
                    "displayName": "Finding {{index}}",
                    "status": { "severity": "High" },
                    "resourceDetails": { "id": "{{vmId}}" }
                  }
                }
                """);
        }

        valueArray.Append(']');
        string body = $$"""{ "value": {{valueArray}}, "nextLink": null }""";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/subAssessments", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(1000, result.VulnerabilityFindings.Count);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-vulnerability-truncated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_warns_when_defender_vulnerability_sub_assessments_pagination_hits_page_cap()
    {
        int subAssessmentRequests = 0;
        string vmId = $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/subAssessments", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref subAssessmentRequests);
            string? nextLink = page <= 64
                ? $"https://management.azure.com/subscriptions/{SubscriptionId}/providers/Microsoft.Security/subAssessments?api-version=2022-01-01&$skiptoken=page-{page}"
                : null;
            string nextLinkJson = nextLink is null ? "null" : $"\"{nextLink}\"";

            string body = $$"""
                {
                  "value": [
                    {
                      "name": "finding-{{page}}",
                      "properties": {
                        "displayName": "Finding {{page}}",
                        "status": { "severity": "High" },
                        "resourceDetails": { "id": "{{vmId}}" }
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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(64, subAssessmentRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-vulnerability-truncated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_warns_when_defender_alert_row_cap_reached_without_listing_page_cap()
    {
        StringBuilder valueArray = new();
        valueArray.Append('[');

        for (int index = 0; index < 501; index++)
        {
            if (index > 0)
            {
                valueArray.Append(',');
            }

            valueArray.Append($$"""
                {
                  "name": "alert-{{index}}",
                  "properties": {
                    "alertDisplayName": "Alert {{index}}",
                    "severity": "Low",
                    "status": "Active",
                    "startTimeUtc": "2026-10-01T00:00:00Z"
                  }
                }
                """);
        }

        valueArray.Append(']');
        string alertsBody = $$"""{ "value": {{valueArray}}, "nextLink": null }""";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/alerts", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(alertsBody),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(500, result.Alerts.Count);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-alerts-truncated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_warns_when_defender_attack_path_endpoint_ids_truncated()
    {
        string vmId =
            $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-base";
        StringBuilder resourceArray = new();
        resourceArray.Append('[');

        for (int index = 0; index < 40; index++)
        {
            if (index > 0)
            {
                resourceArray.Append(',');
            }

            resourceArray.Append($$"""
                { "azureResourceId": "/subscriptions/{{SubscriptionId}}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-{{index}}" }
                """);
        }

        resourceArray.Append(']');

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/attackPaths", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            string body = $$"""
                {
                  "value": [
                    {
                      "name": "path-1",
                      "properties": {
                        "displayName": "Many endpoints",
                        "riskLevel": "High",
                        "entryPointEntityInformation": {{resourceArray}},
                        "targetEntityInformation": { "azureResourceId": "{{vmId}}" }
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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            [
                new HostedAzureArmDefenderPricingRecord { SubscriptionId = SubscriptionId, PricingName = "DefenderCspm", Tier = "Standard" },
            ],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Single(result.AttackPaths);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-attack-paths-truncated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_warns_when_defender_alerts_pagination_hits_page_cap()
    {
        int alertRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/alerts", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref alertRequests);
            string? nextLink = page <= 64
                ? $"https://management.azure.com/subscriptions/{SubscriptionId}/providers/Microsoft.Security/alerts?api-version=2022-01-01&$skiptoken=page-{page}"
                : null;
            string nextLinkJson = nextLink is null ? "null" : $"\"{nextLink}\"";

            string body = $$"""
                {
                  "value": [
                    {
                      "name": "alert-{{page}}",
                      "properties": {
                        "alertDisplayName": "Alert {{page}}",
                        "severity": "High",
                        "status": "Active",
                        "startTimeUtc": "2026-10-01T00:00:00Z"
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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(64, alertRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-alerts-truncated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_http_403_does_not_throw()
    {
        HttpMessageHandler handler = new RecordingHandler((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.Forbidden)));
        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Empty(result.GovernanceAssignments);
        Assert.Empty(result.ComplianceStandards);
        Assert.Empty(result.Alerts);
        Assert.Empty(result.VulnerabilityCounts);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-governance.json", StringComparison.Ordinal));
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-alerts.json", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_warns_when_defender_compliance_control_row_cap_reached_without_listing_page_cap()
    {
        StringBuilder valueArray = new();
        valueArray.Append('[');

        for (int index = 0; index < 501; index++)
        {
            if (index > 0)
            {
                valueArray.Append(',');
            }

            valueArray.Append($$"""
                {
                  "name": "control-{{index}}",
                  "properties": { "state": "Failed", "failedAssessments": 1 }
                }
                """);
        }

        valueArray.Append(']');
        string controlsBody = $$"""{ "value": {{valueArray}}, "nextLink": null }""";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.EndsWith("/regulatoryComplianceStandards", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        """
                        {"value":[{"name":"Azure-CIS","properties":{"state":"Failed","passedControls":0,"failedControls":501,"skippedControls":0}}]}
                        """),
                });
            }

            if (!path.Contains("/regulatoryComplianceControls", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(controlsBody),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(500, result.ComplianceControls.Count);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-compliance-truncated", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_omits_resolved_alerts_from_export()
    {
        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/alerts", StringComparison.Ordinal))
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
                          "name": "alert-resolved-critical",
                          "properties": {
                            "alertDisplayName": "Closed critical",
                            "severity": "Critical",
                            "status": "Resolved",
                            "startTimeUtc": "2026-10-02T00:00:00Z"
                          }
                        },
                        {
                          "name": "alert-active-low",
                          "properties": {
                            "alertDisplayName": "Open low",
                            "severity": "Low",
                            "status": "Active",
                            "startTimeUtc": "2026-10-01T00:00:00Z"
                          }
                        }
                      ]
                    }
                    """),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        HostedAzureArmDefenderAlertRecord alert = Assert.Single(result.Alerts);
        Assert.Equal("alert-active-low", alert.AlertId);
        Assert.Equal("Low", alert.Severity);
        Assert.DoesNotContain(result.Alerts, row => row.AlertId.Contains("resolved", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_retains_compliance_controls_when_follow_up_controls_page_returns_http_500()
    {
        int controlRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.EndsWith("/regulatoryComplianceStandards", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        """
                        {"value":[{"name":"Azure-CIS","properties":{"state":"Failed","passedControls":0,"failedControls":2,"skippedControls":0}}]}
                        """),
                });
            }

            if (!path.Contains("/regulatoryComplianceControls", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref controlRequests);

            if (page == 1)
            {
                string body = $$"""
                    {
                      "value": [
                        {
                          "name": "control-retained",
                          "properties": {
                            "description": "Retained failed control",
                            "state": "Failed"
                          }
                        }
                      ],
                      "nextLink": "https://management.azure.com/subscriptions/{{SubscriptionId}}/providers/Microsoft.Security/regulatoryComplianceStandards/Azure-CIS/regulatoryComplianceControls?api-version=2019-01-01-preview&$skiptoken=page-2"
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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(2, controlRequests);
        Assert.Single(result.ComplianceControls);
        Assert.Equal("control-retained", result.ComplianceControls[0].ControlName);
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-compliance-standards.json collection failed; HTTP 500", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_exports_in_progress_alerts_with_canonical_status_casing()
    {
        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/alerts", StringComparison.Ordinal))
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
                          "name": "alert-in-progress",
                          "properties": {
                            "alertDisplayName": "Investigating",
                            "severity": "Medium",
                            "status": "inprogress",
                            "startTimeUtc": "2026-10-01T00:00:00Z"
                          }
                        },
                        {
                          "name": "alert-active",
                          "properties": {
                            "alertDisplayName": "Open",
                            "severity": "High",
                            "status": "Active",
                            "startTimeUtc": "2026-10-02T00:00:00Z"
                          }
                        }
                      ]
                    }
                    """),
            });
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(2, result.Alerts.Count);
        HostedAzureArmDefenderAlertRecord inProgress = Assert.Single(result.Alerts, alert => alert.AlertId == "alert-in-progress");
        Assert.Equal("InProgress", inProgress.Status);
        Assert.Equal("Active", Assert.Single(result.Alerts, alert => alert.AlertId == "alert-active").Status);
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_retains_attack_paths_when_follow_up_attack_paths_page_returns_http_500()
    {
        int attackRequests = 0;
        string vmId = $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/attackPaths", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref attackRequests);

            if (page == 1)
            {
                string body = $$"""
                    {
                      "value": [
                        {
                          "name": "path-retained",
                          "properties": {
                            "displayName": "Retained path",
                            "riskLevel": "High",
                            "entryPointEntityInformation": { "azureResourceId": "{{vmId}}" },
                            "targetEntityInformation": { "azureResourceId": "{{vmId}}" }
                          }
                        }
                      ],
                      "nextLink": "https://management.azure.com/subscriptions/{{SubscriptionId}}/providers/Microsoft.Security/attackPaths?api-version=2024-01-01&$skiptoken=page-2"
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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            [
                new HostedAzureArmDefenderPricingRecord { SubscriptionId = SubscriptionId, PricingName = "DefenderCspm", Tier = "Standard" },
            ],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(2, attackRequests);
        Assert.Single(result.AttackPaths);
        Assert.Equal("path-retained", result.AttackPaths[0].AttackPathId);
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-attack-paths.json collection failed; HTTP 500", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_rejects_compliance_controls_next_link_with_governance_assignments_scope()
    {
        string crossScopeNextLink =
            $"https://management.azure.com/subscriptions/{SubscriptionId}/providers/Microsoft.Security/governanceAssignments?api-version=2022-01-01-preview&$skiptoken=leak";
        int controlRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (path.EndsWith("/regulatoryComplianceStandards", StringComparison.OrdinalIgnoreCase))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        """
                        {"value":[{"name":"Azure-CIS","properties":{"state":"Failed","passedControls":0,"failedControls":1,"skippedControls":0}}]}
                        """),
                });
            }

            if (!path.Contains("/regulatoryComplianceControls", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            Interlocked.Increment(ref controlRequests);
            string body = $$"""
                {
                  "value": [
                    {
                      "name": "control-one",
                      "properties": { "state": "Failed" }
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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(1, controlRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-companions-rejected-next-link", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_retains_alerts_when_follow_up_alerts_page_returns_http_500()
    {
        int alertRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/alerts", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref alertRequests);

            if (page == 1)
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        """
                        {
                          "value": [
                            {
                              "name": "alert-retained",
                              "properties": {
                                "alertDisplayName": "Retained",
                                "severity": "High",
                                "status": "Active",
                                "startTimeUtc": "2026-10-01T00:00:00Z"
                              }
                            }
                          ],
                          "nextLink": "https://management.azure.com/subscriptions/11111111-1111-1111-1111-111111111111/providers/Microsoft.Security/alerts?api-version=2022-01-01&$skiptoken=page-2"
                        }
                        """),
                });
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(2, alertRequests);
        Assert.Single(result.Alerts);
        Assert.Equal("alert-retained", result.Alerts[0].AlertId);
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-alerts.json collection failed; HTTP 500", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_retains_vulnerability_findings_when_follow_up_sub_assessments_page_returns_http_500()
    {
        int subAssessmentRequests = 0;
        string vmId = $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/subAssessments", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            int page = Interlocked.Increment(ref subAssessmentRequests);

            if (page == 1)
            {
                string body = $$"""
                    {
                      "value": [
                        {
                          "name": "finding-retained",
                          "properties": {
                            "displayName": "Retained CVE",
                            "status": { "severity": "High" },
                            "resourceDetails": { "id": "{{vmId}}" }
                          }
                        }
                      ],
                      "nextLink": "https://management.azure.com/subscriptions/{{SubscriptionId}}/providers/Microsoft.Security/subAssessments?api-version=2019-01-01-preview&$skiptoken=page-2"
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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(2, subAssessmentRequests);
        Assert.Single(result.VulnerabilityFindings);
        Assert.Equal("finding-retained", result.VulnerabilityFindings[0].FindingId);
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-vulnerability-counts.json collection failed; HTTP 500", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_rejects_attack_paths_next_link_with_assessments_scope()
    {
        string crossScopeNextLink =
            $"https://management.azure.com/subscriptions/{SubscriptionId}/providers/Microsoft.Security/assessments?api-version=2021-06-01&$skiptoken=leak";
        int attackRequests = 0;
        string vmId = $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/attackPaths", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            Interlocked.Increment(ref attackRequests);
            string body = $$"""
                {
                  "value": [
                    {
                      "name": "path-one",
                      "properties": {
                        "displayName": "Path",
                        "riskLevel": "High",
                        "entryPointEntityInformation": { "azureResourceId": "{{vmId}}" },
                        "targetEntityInformation": { "azureResourceId": "{{vmId}}" }
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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            [
                new HostedAzureArmDefenderPricingRecord { SubscriptionId = SubscriptionId, PricingName = "DefenderCspm", Tier = "Standard" },
            ],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(1, attackRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-companions-rejected-next-link", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_rejects_sub_assessments_next_link_with_alerts_scope()
    {
        int subAssessmentRequests = 0;
        string vmId = $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";
        string crossScopeNextLink =
            $"https://management.azure.com/subscriptions/{SubscriptionId}/providers/Microsoft.Security/alerts?api-version=2022-01-01&$skiptoken=leak";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/subAssessments", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            Interlocked.Increment(ref subAssessmentRequests);
            string body = $$"""
                {
                  "value": [
                    {
                      "name": "finding-one",
                      "properties": {
                        "displayName": "Finding",
                        "status": { "severity": "High" },
                        "resourceDetails": { "id": "{{vmId}}" }
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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(1, subAssessmentRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-companions-rejected-next-link", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_clears_compliance_controls_when_standards_listing_returns_http_404_on_first_page()
    {
        int standardsRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/regulatoryComplianceStandards", StringComparison.Ordinal)
                || path.Contains("/regulatoryComplianceControls", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            Interlocked.Increment(ref standardsRequests);
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
        });

        GetOnlyHostedAzureArmReadClient client = new(new HttpClient(handler), NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(1, standardsRequests);
        Assert.Empty(result.ComplianceStandards);
        Assert.Empty(result.ComplianceControls);
        Assert.Contains(
            result.Warnings,
            warning => warning.Contains("defender-compliance-standards.json collection failed; HTTP 404", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_rejects_governance_next_link_with_pricings_scope()
    {
        string storageId = $"/subscriptions/{SubscriptionId}/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        string crossScopeNextLink =
            $"https://management.azure.com/subscriptions/{SubscriptionId}/providers/Microsoft.Security/pricings?api-version=2024-01-01&$skiptoken=leak";
        int governanceRequests = 0;

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/governanceAssignments", StringComparison.Ordinal)
                || path.Contains("/assessments/", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            Interlocked.Increment(ref governanceRequests);
            string body = $$"""
                {
                  "value": [
                    {
                      "id": "{{storageId}}/providers/Microsoft.Security/assessments/key-1/governanceAssignments/g1",
                      "name": "g1",
                      "properties": {
                        "owner": "soc@contoso.com",
                        "remediationDueDate": "2026-11-01T00:00:00Z",
                        "isGracePeriod": false
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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(1, governanceRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-companions-rejected-next-link", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CollectSubscriptionDefenderFollowOnAsync_rejects_alerts_next_link_with_sub_assessments_scope()
    {
        int alertRequests = 0;
        string crossScopeNextLink =
            $"https://management.azure.com/subscriptions/{SubscriptionId}/providers/Microsoft.Security/subAssessments?api-version=2019-01-01-preview&$skiptoken=leak";

        HttpMessageHandler handler = new RecordingHandler((request, _) =>
        {
            string path = request.RequestUri?.AbsolutePath ?? string.Empty;

            if (!path.Contains("/alerts", StringComparison.Ordinal))
            {
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"value":[]}"""),
                });
            }

            Interlocked.Increment(ref alertRequests);
            string body = $$"""
                {
                  "value": [
                    {
                      "name": "alert-one",
                      "properties": {
                        "alertDisplayName": "Alert",
                        "severity": "High",
                        "status": "Active",
                        "startTimeUtc": "2026-10-01T00:00:00Z"
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
        HostedAzureDefenderFollowOnCollectResult result = await client.CollectSubscriptionDefenderFollowOnAsync(
            "token-abc",
            SubscriptionId,
            pricings: [],
            assessmentKeys: [],
            CancellationToken.None);

        Assert.Equal(1, alertRequests);
        Assert.Contains(result.Warnings, warning => warning.Contains("defender-companions-rejected-next-link", StringComparison.Ordinal));
    }

    private static string Count(ref int calls, string body)
    {
        calls++;
        return body;
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
