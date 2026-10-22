using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

/// <summary>
/// Covers anonymous-vs-authenticated branching in <see cref="QuickScanExecutionOrchestrator" />
/// (safety gates only when <see cref="QuickScanExecutionRequestContext.RequiresAnonymousDistributedConcurrency" /> is true).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "QuickScanAdversarial")]
public sealed class QuickScanExecutionOrchestratorAnonymousGatingTests
{
    [Fact]
    public async Task ExecuteAsync_AuthenticatedContext_SkipsAnonymousSafetyGates_WhenSafetyEnabled()
    {
        QuickScanAdversarialOrchestratorTestFixture fixture = new();
        fixture.SafetyOptions.PerRequest.MaxInputTokens = 50;
        fixture.Operational
            .Setup(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QuickScanSafetyOperationalSnapshot
            {
                Mode = QuickScanSafetyOperationalMode.EmergencyDisabled,
                AnonymousExecutionAllowed = false,
                SampleResultAvailable = true,
                PublicMessage = "Anonymous path blocked.",
                StoreHealthy = true,
            });

        ArchitectureQuickScanRequest request = QuickScanAdversarialOrchestratorTestFixture.ValidRequest(
            description: new string('x', 400));

        QuickScanExecutionResult result = await fixture.CreateOrchestrator().ExecuteAsync(
            request,
            QuickScanAdversarialOrchestratorTestFixture.AuthenticatedContext(),
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();

        fixture.CostEstimator.Verify(
            c => c.TryReserveCost(
                It.IsAny<QuickScanRequestValidator.ValidatedQuickScanRequest>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset>()),
            Times.Never);

        fixture.GlobalBudget.Verify(
            g => g.TryReserveAsync(
                It.IsAny<string>(),
                It.IsAny<decimal>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Never);

        fixture.Concurrency.Verify(
            c => c.WaitForAdmissionAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);

        fixture.IdentityAbuse.Verify(
            a => a.TryAdmitAsync(It.IsAny<QuickScanIdentityAbuseAdmitContext>(), It.IsAny<CancellationToken>()),
            Times.Never);

        fixture.Guard.Verify(
            g => g.TryBeginScan(It.Is<QuickScanGuardContext>(ctx => !ctx.UseDistributedConcurrencyLimit)),
            Times.Once);

        fixture.QuickScanService.Verify(
            q => q.ScanAsync(It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_AnonymousContext_AppliesAnonymousSafetyGates_WhenSafetyEnabled()
    {
        QuickScanAdversarialOrchestratorTestFixture fixture = new();
        fixture.SafetyOptions.PerRequest.MaxInputTokens = 50;

        QuickScanExecutionResult result = await fixture.CreateOrchestrator().ExecuteAsync(
            QuickScanAdversarialOrchestratorTestFixture.ValidRequest(description: new string('x', 400)),
            QuickScanAdversarialOrchestratorTestFixture.AnonymousContext(),
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(QuickScanExecutionFailureKind.Validation);
        result.ValidationDetail.Should().Contain("maximum input size");

        fixture.CostEstimator.Verify(
            c => c.TryReserveCost(
                It.IsAny<QuickScanRequestValidator.ValidatedQuickScanRequest>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset>()),
            Times.Never);

        fixture.Concurrency.Verify(
            c => c.WaitForAdmissionAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);

        fixture.Guard.Verify(
            g => g.TryBeginScan(It.IsAny<QuickScanGuardContext>()),
            Times.Never);

        fixture.QuickScanService.Verify(
            q => q.ScanAsync(It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExecuteAsync_AnonymousContext_InvokesCostBudgetAndConcurrency_WhenSafetyEnabled()
    {
        QuickScanAdversarialOrchestratorTestFixture fixture = new();

        QuickScanExecutionResult result = await fixture.CreateOrchestrator().ExecuteAsync(
            QuickScanAdversarialOrchestratorTestFixture.ValidRequest(),
            QuickScanAdversarialOrchestratorTestFixture.AnonymousContext(),
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();

        fixture.CostEstimator.Verify(
            c => c.TryReserveCost(
                It.IsAny<QuickScanRequestValidator.ValidatedQuickScanRequest>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset>()),
            Times.Once);

        fixture.GlobalBudget.Verify(
            g => g.TryReserveAsync(
                It.IsAny<string>(),
                It.IsAny<decimal>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Once);

        fixture.Concurrency.Verify(
            c => c.WaitForAdmissionAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);

        fixture.IdentityAbuse.Verify(
            a => a.TryAdmitAsync(It.IsAny<QuickScanIdentityAbuseAdmitContext>(), It.IsAny<CancellationToken>()),
            Times.Once);

        fixture.Guard.Verify(
            g => g.TryBeginScan(It.Is<QuickScanGuardContext>(ctx =>
                ctx.UseDistributedConcurrencyLimit && ctx.UseDistributedIdentityAbuseLimit)),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_AnonymousContext_BlocksAtEntry_WhenAnonymousExecutionDisabled()
    {
        QuickScanAdversarialOrchestratorTestFixture fixture = new();
        fixture.Operational
            .Setup(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QuickScanSafetyOperationalSnapshot
            {
                Mode = QuickScanSafetyOperationalMode.EmergencyDisabled,
                AnonymousExecutionAllowed = false,
                SampleResultAvailable = true,
                PublicMessage = "Emergency stop.",
                StoreHealthy = true,
            });

        QuickScanExecutionResult result = await fixture.CreateOrchestrator().ExecuteAsync(
            QuickScanAdversarialOrchestratorTestFixture.ValidRequest(),
            QuickScanAdversarialOrchestratorTestFixture.AnonymousContext(),
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(QuickScanExecutionFailureKind.EmergencyDisabled);
        result.ValidationDetail.Should().Be("Emergency stop.");

        fixture.Operational.Verify(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()), Times.Once);
        fixture.QuickScanService.Verify(
            q => q.ScanAsync(It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
