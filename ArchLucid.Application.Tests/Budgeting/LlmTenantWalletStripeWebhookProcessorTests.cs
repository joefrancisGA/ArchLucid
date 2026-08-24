using ArchLucid.Application.Budgeting;
using ArchLucid.Core.Budgeting;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Budgeting;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class LlmTenantWalletStripeWebhookProcessorTests
{
    [Fact]
    public async Task ProcessPaymentIntentEventAsync_trims_whitespace_from_tenant_metadata()
    {
        Mock<ILlmTenantWalletService> walletService = new();
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        walletService
            .Setup(s => s.ApplyWebhookPaymentIntentSucceededAsync(
                tenantId,
                "pi_trim_test",
                10.00m,
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        LlmTenantWalletStripeWebhookProcessor sut = new(walletService.Object);

        await sut.ProcessPaymentIntentEventAsync(
            "payment_intent.succeeded",
            "pi_trim_test",
            "  " + tenantId.ToString("D") + "  ",
            1000,
            null,
            Guid.NewGuid());

        walletService.Verify(
            s => s.ApplyWebhookPaymentIntentSucceededAsync(
                tenantId,
                "pi_trim_test",
                10.00m,
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessPaymentIntentEventAsync_throws_when_tenant_metadata_missing_on_success()
    {
        Mock<ILlmTenantWalletService> walletService = new();
        LlmTenantWalletStripeWebhookProcessor sut = new(walletService.Object);

        Func<Task> act = () => sut.ProcessPaymentIntentEventAsync(
            "payment_intent.succeeded",
            "pi_missing_tenant",
            tenantIdRaw: null,
            1000,
            null,
            Guid.NewGuid());

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*tenant_id*");
        walletService.Verify(
            s => s.ApplyWebhookPaymentIntentSucceededAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<decimal>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
