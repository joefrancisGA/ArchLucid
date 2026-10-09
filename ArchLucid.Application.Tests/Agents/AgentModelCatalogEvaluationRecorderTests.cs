using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Agents;

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
            new FixedScopeContextProvider());

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
}
