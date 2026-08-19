using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Routing;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     End-to-end: create digest subscription → advisory scan persists digest and dispatcher records a delivery attempt →
///     GET attempts.
/// </summary>
[Trait("Category", "Integration")]
[Collection("ArchLucidEnvMutation")]
public sealed class DigestDeliveryLifecycleIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    [SkippableFact]
    public Task Create_subscription_run_advisory_scan_lists_succeeded_delivery_attempt()
    {
        return IntegrationTestDeadline.RunAsync(
            nameof(Create_subscription_run_advisory_scan_lists_succeeded_delivery_attempt),
            async testDeadline =>
            {
                await using AlertLifecycleWebAppFactory factory = new();
                using CancellationTokenSource requestTimeout =
                    IntegrationTestDeadline.CreateLinkedRequestTimeoutSource(testDeadline);

                IServiceProvider services = await AlertLifecycleIntegrationHost.EnsureStartedAsync(factory);
                await AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync(services, requestTimeout.Token);

                HttpClient client = await AlertLifecycleIntegrationHost.EnsureClientAsync(factory);

                HttpResponseMessage subResponse = await client.PostAsJsonAsync(
                    $"/{ApiV1Routes.DigestSubscriptions}",
                    new
                    {
                        name = "Lifecycle digest email",
                        channelType = DigestDeliveryChannelType.Email,
                        destination = "operator@example.com",
                        isEnabled = true
                    },
                    JsonOptions,
                    requestTimeout.Token);

                subResponse.StatusCode.Should().Be(HttpStatusCode.OK);
                DigestSubscription? subscription = await subResponse.Content
                    .ReadFromJsonAsync<DigestSubscription>(JsonOptions, requestTimeout.Token);
                subscription.Should().NotBeNull();
                Guid subscriptionId = subscription.SubscriptionId;

                HttpResponseMessage createScheduleResponse = await client.PostAsJsonAsync(
                    "v1/advisory-scheduling/schedules",
                    new
                    {
                        name = "Digest lifecycle scan",
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

                HttpResponseMessage attemptsResponse = await client
                    .GetAsync(
                        new Uri($"/{ApiV1Routes.DigestSubscriptions}/{subscriptionId:D}/attempts?take=20",
                            UriKind.Relative), requestTimeout.Token);

                attemptsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
                List<DigestDeliveryAttempt>? attempts = await attemptsResponse.Content
                    .ReadFromJsonAsync<List<DigestDeliveryAttempt>>(JsonOptions, requestTimeout.Token);

                attempts.Should().NotBeNull();
                attempts.Should().Contain(a =>
                    a.SubscriptionId == subscriptionId &&
                    string.Equals(a.Status, DigestDeliveryStatus.Succeeded, StringComparison.OrdinalIgnoreCase));
            });
    }
}
