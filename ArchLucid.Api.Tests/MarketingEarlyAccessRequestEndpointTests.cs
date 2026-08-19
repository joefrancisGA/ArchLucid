using System.Net;
using System.Net.Http.Json;

using ArchLucid.Application.Notifications.Email;
using ArchLucid.Contracts.Marketing;
using ArchLucid.Persistence.Marketing;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for <c>POST /v1/marketing/early-access</c> — persist + sales notification path.</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class MarketingEarlyAccessRequestEndpointTests
{
    private static readonly Guid SeededRequestId = Guid.Parse("88888888-8888-8888-8888-888888888888");

    [SkippableFact]
    public async Task PostEarlyAccessRequest_after_successful_persist_invokes_sales_notifier()
    {
        DateTime createdUtc = new(2026, 5, 16, 12, 0, 0, DateTimeKind.Utc);
        SeededEarlyAccessRepository repo = new(new MarketingEarlyAccessRequestInsertResult(SeededRequestId, createdUtc));

        Mock<IMarketingEarlyAccessSalesNotifier> notifier = new();
        notifier
            .Setup(n => n.NotifyAsync(
                It.IsAny<MarketingEarlyAccessRequestInsertResult>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        await using OpenApiContractWebAppFactory baseFactory = new();
        await using WebApplicationFactory<Program> factory = baseFactory.WithWebHostBuilder(b =>
            b.ConfigureTestServices(services =>
            {
                services.RemoveAll<IMarketingEarlyAccessRequestRepository>();
                services.AddSingleton<IMarketingEarlyAccessRequestRepository>(repo);
                services.RemoveAll<IMarketingEarlyAccessSalesNotifier>();
                services.AddSingleton(notifier.Object);
            }));

        HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/v1/marketing/early-access",
            new
            {
                email = "buyer@example.com",
                companyName = "Contoso",
                role = "Architect",
                websiteUrl = "",
                utmSource = "linkedin",
            });

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        notifier.Verify(
            n => n.NotifyAsync(
                It.Is<MarketingEarlyAccessRequestInsertResult>(r =>
                    r.Id == SeededRequestId && r.CreatedUtc == createdUtc),
                "buyer@example.com",
                "Contoso",
                "Architect",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private sealed class SeededEarlyAccessRepository(MarketingEarlyAccessRequestInsertResult insert)
        : IMarketingEarlyAccessRequestRepository
    {
        public Task<MarketingEarlyAccessRequestInsertResult?> AppendAsync(
            string email,
            string? companyName,
            string? role,
            string? utmSource,
            string? utmMedium,
            string? utmCampaign,
            byte[]? clientIpSha256,
            CancellationToken cancellationToken) =>
            Task.FromResult<MarketingEarlyAccessRequestInsertResult?>(insert);
    }
}
