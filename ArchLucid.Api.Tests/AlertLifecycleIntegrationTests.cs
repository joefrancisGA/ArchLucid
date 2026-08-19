using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Routing;
using ArchLucid.Core.Pagination;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Decisioning.Alerts;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     End-to-end: create simple alert rule → run advisory scan (evaluates rules) → list persisted
///     <see cref="AlertRecord" /> rows via HTTP.
/// </summary>
[Trait("Category", "Integration")]
[Collection("ArchLucidEnvMutation")]
public sealed class AlertLifecycleIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    [SkippableFact]
    public Task Create_rule_run_advisory_scan_list_alerts_persists_open_alert()
    {
        return IntegrationTestDeadline.RunAsync(
            nameof(Create_rule_run_advisory_scan_list_alerts_persists_open_alert),
            async testDeadline =>
            {
                await using AlertLifecycleWebAppFactory factory = new();
                using CancellationTokenSource requestTimeout =
                    IntegrationTestDeadline.CreateLinkedRequestTimeoutSource(testDeadline);

                IServiceProvider services = await AlertLifecycleIntegrationHost.EnsureStartedAsync(factory);
                await AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync(services, requestTimeout.Token);

                HttpClient client = await AlertLifecycleIntegrationHost.EnsureClientAsync(factory);

                HttpResponseMessage createRuleResponse = await client.PostAsJsonAsync(
                    $"/{ApiV1Routes.AlertRules}",
                    new
                    {
                        name = "Integration lifecycle — critical rec count",
                        ruleType = AlertRuleType.CriticalRecommendationCount,
                        severity = AlertSeverity.Warning,
                        thresholdValue = 0m,
                        isEnabled = true,
                        targetChannelType = "DigestOnly"
                    },
                    JsonOptions,
                    requestTimeout.Token);

                createRuleResponse.StatusCode.Should().Be(HttpStatusCode.OK);
                AlertRule? createdRule =
                    await createRuleResponse.Content.ReadFromJsonAsync<AlertRule>(JsonOptions, requestTimeout.Token);
                createdRule.Should().NotBeNull();
                Guid ruleId = createdRule.RuleId;
                ruleId.Should().NotBeEmpty();

                HttpResponseMessage createScheduleResponse = await client.PostAsJsonAsync(
                    "v1/advisory-scheduling/schedules",
                    new
                    {
                        name = "Lifecycle test scan",
                        cronExpression = "0 7 * * *",
                        isEnabled = true,
                        runProjectSlug = AdvisoryScanSchedule.DefaultProjectSlug
                    },
                    JsonOptions,
                    requestTimeout.Token);

                createScheduleResponse.StatusCode.Should().Be(HttpStatusCode.OK);
                AdvisoryScanSchedule? schedule = await createScheduleResponse.Content
                    .ReadFromJsonAsync<AdvisoryScanSchedule>(JsonOptions, requestTimeout.Token);
                schedule.Should().NotBeNull();

                HttpResponseMessage runResponse = await client
                    .PostAsync($"v1/advisory-scheduling/schedules/{schedule.ScheduleId:D}/run", null,
                        requestTimeout.Token);

                runResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

                HttpResponseMessage listAlertsResponse = await client
                    .GetAsync(new Uri($"/{ApiV1Routes.Alerts}?take=50", UriKind.Relative), requestTimeout.Token);

                listAlertsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
                PagedResponse<AlertRecord>? alertsPage = await listAlertsResponse.Content
                    .ReadFromJsonAsync<PagedResponse<AlertRecord>>(JsonOptions, requestTimeout.Token);

                alertsPage.Should().NotBeNull();
                alertsPage!.Items.Should().Contain(a =>
                    a.RuleId == ruleId && string.Equals(a.Status, AlertStatus.Open, StringComparison.OrdinalIgnoreCase));
            });
    }
}
