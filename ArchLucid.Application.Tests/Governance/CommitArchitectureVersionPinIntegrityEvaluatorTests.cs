using ArchLucid.Application.Architecture;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class CommitArchitectureVersionPinIntegrityEvaluatorTests
{
    [Fact]
    public async Task GetBlockingReasonsAsync_returns_invalid_run_id_before_repository_calls_for_non_guid()
    {
        ScopeContext scope = new();
        ArchitectureRequest request = new();
        Mock<IRunRepository> runRepository = new(MockBehavior.Strict);
        Mock<IArchitectureVersionRepository> versionRepository = new(MockBehavior.Strict);
        Mock<IArchitectureKnowledgeModelAccess> knowledgeModelAccess = new(MockBehavior.Strict);

        IReadOnlyList<string> reasons = await CommitArchitectureVersionPinIntegrityEvaluator.GetBlockingReasonsAsync(
            scope,
            "opaque-run-id",
            request,
            runRepository.Object,
            versionRepository.Object,
            knowledgeModelAccess.Object);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("invalid for architecture version pin verification");
    }
}
