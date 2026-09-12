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
    public async Task ProcessPaymentIntentEventAsync_throws_when_tenant_metadata_is_not_guid()
    {
        Mock<ILlmTenantWalletService> walletService = new();
        LlmTenantWalletStripeWebhookProcessor sut = new(walletService.Object);

        Func<Task> act = () => sut.ProcessPaymentIntentEventAsync(
            "payment_intent.succeeded",
            "pi_bad_tenant",
            "division-east",
            1000,
            null,
            Guid.NewGuid());

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*invalid tenant_id*");
    }

    [Fact]
    public async Task ProcessPaymentIntentEventAsync_throws_when_tenant_metadata_is_empty_guid()
    {
        Mock<ILlmTenantWalletService> walletService = new();
        LlmTenantWalletStripeWebhookProcessor sut = new(walletService.Object);

        Func<Task> act = () => sut.ProcessPaymentIntentEventAsync(
            "payment_intent.succeeded",
            "pi_empty_tenant",
            Guid.Empty.ToString("D"),
            1000,
            null,
            Guid.NewGuid());

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*invalid tenant_id*");
        walletService.Verify(
            s => s.ApplyWebhookPaymentIntentSucceededAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<decimal>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ProcessPaymentIntentEventAsync_skips_wallet_credit_when_payment_intent_id_blank()
    {
        Mock<ILlmTenantWalletService> walletService = new();
        LlmTenantWalletStripeWebhookProcessor sut = new(walletService.Object);

        await sut.ProcessPaymentIntentEventAsync(
            "payment_intent.succeeded",
            paymentIntentId: "   ",
            tenantIdRaw: Guid.NewGuid().ToString("D"),
            1000,
            null,
            Guid.NewGuid());

        walletService.Verify(
            s => s.ApplyWebhookPaymentIntentSucceededAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<decimal>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ProcessPaymentIntentEventAsync_forwards_zero_amount_to_wallet_service_without_crediting()
    {
        Mock<ILlmTenantWalletService> walletService = new();
        Guid tenantId = Guid.NewGuid();

        walletService
            .Setup(s => s.ApplyWebhookPaymentIntentSucceededAsync(
                tenantId,
                "pi_zero_amount",
                0m,
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        LlmTenantWalletStripeWebhookProcessor sut = new(walletService.Object);

        await sut.ProcessPaymentIntentEventAsync(
            "payment_intent.succeeded",
            "pi_zero_amount",
            tenantId.ToString("D"),
            amountCents: 0,
            null,
            Guid.NewGuid());

        walletService.Verify(
            s => s.ApplyWebhookPaymentIntentSucceededAsync(
                tenantId,
                "pi_zero_amount",
                0m,
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
