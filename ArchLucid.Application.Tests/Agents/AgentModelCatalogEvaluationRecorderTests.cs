using ArchLucid.Application.Agents;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Agents;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Suite", "Core")]
public sealed class AgentModelCatalogEvaluationRecorderTests
{
    [Fact]
    public async Task RecordTaskEvaluationAsync_keeps_tokenizer_settings_and_usd_rates()
    {
        InMemoryAgentModelCatalogRepository repository = new();
        AgentModelCatalogRow seed = new()
        {
            AliasId = AgentModelAliasIds.StandardGeneral,
            ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
            DeploymentName = "gpt-eval",
            TierBinding = "Standard",
            CapabilityTags = [AgentModelAliasCapabilities.StructuredOutput],
            ApprovedTaskTypes = [AgentModelTaskTypes.Primary],
            CharsPerToken = 8,
            TokenizerErrorMarginPercent = 12.5m,
            InputUsdPerMillionTokens = 1.25m,
            OutputUsdPerMillionTokens = 5m,
            ReasoningUsdPerMillionTokens = 10m,
            Evaluations = []
        };

        await repository.UpsertAsync(seed, CancellationToken.None);

        AgentModelCatalogEvaluationRecorder recorder = new(
            repository,
            new NoOpAgentModelCatalogCacheInvalidator(),
            new NoOpAuditService(),
            new FixedScopeContextProvider(),
            new FixedActorContext("operator@test"));

        AgentModelCatalogRow saved = await recorder.RecordTaskEvaluationAsync(
            seed.AliasId,
            AgentModelTaskTypes.Primary,
            AgentModelEvaluationStateKind.Evaluated,
            """{"source":"operator"}""",
            "operator@test",
            CancellationToken.None);

        Assert.Equal(8, saved.CharsPerToken);
        Assert.Equal(12.5m, saved.TokenizerErrorMarginPercent);
        Assert.Equal(1.25m, saved.InputUsdPerMillionTokens);
        Assert.Equal(5m, saved.OutputUsdPerMillionTokens);
        Assert.Equal(10m, saved.ReasoningUsdPerMillionTokens);
        Assert.Equal("gpt-eval", saved.DeploymentName);
        Assert.Equal(AgentModelEvaluationStateKind.Evaluated, saved.Evaluations[0].EvaluationState);
    }

    [Fact]
    public async Task RecordTaskEvaluationAsync_sets_explicit_actor_for_stable_actor_user_id_when_display_differs()
    {
        const string actorKey = "jwt:tenant:operator-oid";
        AuditEvent? captured = null;

        InMemoryAgentModelCatalogRepository repository = new();
        AgentModelCatalogRow seed = new()
        {
            AliasId = AgentModelAliasIds.StandardGeneral,
            ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
            DeploymentName = "gpt-eval",
            TierBinding = "Standard",
            CapabilityTags = [AgentModelAliasCapabilities.StructuredOutput],
            ApprovedTaskTypes = [AgentModelTaskTypes.Primary],
            Evaluations = [],
        };

        await repository.UpsertAsync(seed, CancellationToken.None);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActorId()).Returns(actorKey);
        actorContext.Setup(a => a.GetActor()).Returns("Operator Display");

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((evt, _) => captured = evt)
            .Returns(Task.CompletedTask);

        AgentModelCatalogEvaluationRecorder recorder = new(
            repository,
            new NoOpAgentModelCatalogCacheInvalidator(),
            auditService.Object,
            new FixedScopeContextProvider(),
            actorContext.Object);

        await recorder.RecordTaskEvaluationAsync(
            seed.AliasId,
            AgentModelTaskTypes.Primary,
            AgentModelEvaluationStateKind.Evaluated,
            """{"source":"operator"}""",
            "Operator Display",
            CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.ExplicitActor.Should().BeTrue();
        captured.ActorUserId.Should().Be(actorKey);
        captured.ActorUserName.Should().Be("Operator Display");
    }

    private sealed class NoOpAgentModelCatalogCacheInvalidator : IAgentModelCatalogCacheInvalidator
    {
        public void Invalidate()
        {
        }
    }

    private sealed class NoOpAuditService : IAuditService
    {
        public Task LogAsync(AuditEvent auditEvent, CancellationToken cancellationToken) => Task.CompletedTask;

        public Task LogAsync(AuditEvent auditEvent, IArchLucidUnitOfWork unitOfWork, CancellationToken cancellationToken) =>
            Task.CompletedTask;
    }

    private sealed class FixedScopeContextProvider : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope() =>
            new()
            {
                TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
            };
    }

    private sealed class FixedActorContext(string actorId) : IActorContext
    {
        public string GetActor() => actorId;

        public string GetActorId() => actorId;

        public string? TryGetSubmitterMailbox() => null;
    }
}
