using ArchLucid.Application.DataConsistency;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.DataConsistency;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class MissingArchitectureRequestRunRemediatorTests
{
    [Fact]
    public async Task RemediateAsync_when_storage_is_in_memory_returns_empty_without_database()
    {
        Mock<IArchLucidStorageMode> storage = new();
        storage.SetupGet(s => s.IsInMemory).Returns(true);

        Mock<IDbConnectionFactory> connectionFactory = new(MockBehavior.Strict);
        Mock<IRunRepository> runs = new(MockBehavior.Strict);

        Mock<IOptionsMonitor<MissingArchitectureRequestAutoRemediationOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new MissingArchitectureRequestAutoRemediationOptions());

        MissingArchitectureRequestRunRemediator sut = new(
            connectionFactory.Object,
            runs.Object,
            storage.Object,
            options.Object,
            NullLogger<MissingArchitectureRequestRunRemediator>.Instance);

        MissingArchitectureRequestRemediationOutcome outcome =
            await sut.RemediateAsync(dryRun: false, maxRows: 25, CancellationToken.None);

        outcome.CandidateCount.Should().Be(0);
        outcome.CandidateRunIds.Should().BeEmpty();
        outcome.ArchivedRunIds.Should().BeEmpty();
        outcome.SkippedRunIds.Should().BeEmpty();
    }
}
