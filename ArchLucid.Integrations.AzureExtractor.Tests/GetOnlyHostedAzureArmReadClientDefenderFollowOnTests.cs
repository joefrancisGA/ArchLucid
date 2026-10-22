using System.Net;
using System.Text.Json;

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
