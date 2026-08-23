using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Retrieval.Citations;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.PolicyPacks;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

internal static class ComplianceAgentHandlerTestDependencies
{
    internal static AgentPolicyPackRetrievalAppender CreatePolicyPackRetrievalAppender(
        IScopeContextProvider scopeProvider,
        IRetrievalQueryService? retrievalQueryService = null,
        IRetrievalGroundingTraceWriter? groundingTraceWriter = null,
        IPolicyPackResolver? policyPackResolver = null)
    {
        retrievalQueryService ??= CreateEmptyRetrievalQueryService();
        groundingTraceWriter ??= CreateNoOpGroundingTraceWriter();
        policyPackResolver ??= CreateEmptyPolicyPackResolver();

        Mock<IOptionsMonitor<PolicyPackCorpusIndexerOptions>> corpusOptions = new();
        corpusOptions.Setup(o => o.CurrentValue).Returns(new PolicyPackCorpusIndexerOptions());

        AgentPolicyPackRulePackIdResolver rulePackIdResolver = new(
            policyPackResolver,
            corpusOptions.Object);

        return new AgentPolicyPackRetrievalAppender(
            scopeProvider,
            retrievalQueryService,
            CreateCitationFormatter(),
            groundingTraceWriter,
            rulePackIdResolver,
            NullLogger<AgentPolicyPackRetrievalAppender>.Instance);
    }

    internal static IPolicyPackResolver CreateEmptyPolicyPackResolver()
    {
        Mock<IPolicyPackResolver> resolver = new();
        resolver.Setup(r => r.ResolveAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Contracts.Governance.PolicyPacks.EffectivePolicyPackSet());

        return resolver.Object;
    }

    internal static IRetrievalQueryService CreateEmptyRetrievalQueryService()
    {
        Mock<IRetrievalQueryService> retrieval = new();
        retrieval.Setup(r => r.SearchAsync(It.IsAny<RetrievalQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return retrieval.Object;
    }

    internal static IRetrievalCitationFormatter CreateCitationFormatter() => new RetrievalCitationFormatter();

    internal static IRetrievalGroundingTraceWriter CreateNoOpGroundingTraceWriter()
    {
        Mock<IRetrievalGroundingTraceWriter> writer = new();
        writer.Setup(w => w.AppendAsync(It.IsAny<RetrievalGroundingTraceInsert>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return writer.Object;
    }

    internal static ILogger<ComplianceAgentHandler> CreateNullLogger() =>
        NullLogger<ComplianceAgentHandler>.Instance;

    internal static ILogger<TopologyAgentHandler> CreateTopologyNullLogger() =>
        NullLogger<TopologyAgentHandler>.Instance;

    internal static ITechnologyLedgerRepository CreateEmptyTechnologyLedgerRepository()
    {
        Mock<ITechnologyLedgerRepository> ledger = new();
        ledger.Setup(r => r.GetByRunIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return ledger.Object;
    }

    internal static ITechnologyLedgerRepository CreateTechnologyLedgerRepository(
        ScopeContext scope,
        string runId,
        IReadOnlyList<TechnologyLedgerEntry> entries)
    {
        Mock<ITechnologyLedgerRepository> ledger = new();
        ledger.Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entries);

        return ledger.Object;
    }
}
