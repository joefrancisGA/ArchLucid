using ArchLucid.AgentRuntime.FineTuning;
using ArchLucid.Retrieval.FineTuning.Consent;
using ArchLucid.Retrieval.FineTuning.Models;
using ArchLucid.Retrieval.FineTuning.Registry;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Retrieval.Tests.FineTuning;

[Trait("Category", "Unit")]
public sealed class FineTunedAgentCompletionDeploymentResolverTests
{
    [Fact]
    public async Task ResolveDeploymentNameAsync_returns_default_when_fine_tuning_disabled()
    {
        InMemoryFineTunedModelRegistry registry = new();
        FineTunedAgentCompletionDeploymentResolver resolver = CreateResolver(
            registry,
            enabled: false,
            consent: FineTuningConsentStatus.Enabled);

        string deployment = await resolver.ResolveDeploymentNameAsync(
            Guid.NewGuid(),
            "gpt-4o",
            CancellationToken.None);

        deployment.Should().Be("gpt-4o");
    }

    [Fact]
    public async Task ResolveDeploymentNameAsync_returns_promoted_deployment_when_consented_and_active()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryFineTunedModelRegistry registry = new();
        await registry.SaveAsync(
            new FineTunedModelRegistryEntry
            {
                TenantId = tenantId,
                FineTunedModelDeploymentName = "ft-governance-v1",
                IsActive = true,
                PromotedUtc = DateTime.UtcNow,
                Status = FineTuningJobStatus.Succeeded,
            },
            CancellationToken.None);

        FineTunedAgentCompletionDeploymentResolver resolver = CreateResolver(
            registry,
            enabled: true,
            consent: FineTuningConsentStatus.Enabled);

        string deployment = await resolver.ResolveDeploymentNameAsync(tenantId, "gpt-4o", CancellationToken.None);

        deployment.Should().Be("ft-governance-v1");
    }

    [Fact]
    public async Task ResolveDeploymentNameAsync_fails_open_when_registry_throws()
    {
        ThrowingFineTunedModelRegistry registry = new();
        FineTunedAgentCompletionDeploymentResolver resolver = CreateResolver(
            registry,
            enabled: true,
            consent: FineTuningConsentStatus.Enabled);

        string deployment = await resolver.ResolveDeploymentNameAsync(
            Guid.NewGuid(),
            "gpt-4o",
            CancellationToken.None);

        deployment.Should().Be("gpt-4o");
    }

    private static FineTunedAgentCompletionDeploymentResolver CreateResolver(
        IFineTunedModelRegistry registry,
        bool enabled,
        FineTuningConsentStatus consent)
    {
        return new FineTunedAgentCompletionDeploymentResolver(
            FineTuningTestFixtures.CreateOptions(enabled: enabled),
            new FakeFineTuningConsentService(consent),
            registry,
            NullLogger<FineTunedAgentCompletionDeploymentResolver>.Instance);
    }

    private sealed class ThrowingFineTunedModelRegistry : IFineTunedModelRegistry
    {
        public Task SaveAsync(FineTunedModelRegistryEntry entry, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("boom");

        public Task<FineTunedModelRegistryEntry?> TryGetActiveAsync(Guid tenantId, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("boom");

        public Task RollbackActiveAsync(Guid tenantId, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("boom");
    }
}
