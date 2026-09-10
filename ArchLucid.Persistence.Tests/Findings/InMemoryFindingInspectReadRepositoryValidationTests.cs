using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryFindingInspectReadRepositoryValidationTests
{
    [Fact]
    public async Task GetInspectAsync_throws_when_scope_is_null()
    {
        InMemoryFindingInspectReadRepository repository = new(new Mock<IAuthorityQueryService>().Object);

        Func<Task> act = async () => await repository.GetInspectAsync(
            scope: null!,
            findingId: "finding-demo-00000000000000000000000000000001-primary",
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task GetInspectAsync_throws_when_finding_id_is_whitespace()
    {
        InMemoryFindingInspectReadRepository repository = new(new Mock<IAuthorityQueryService>().Object);
        ScopeContext scope = new();

        Func<Task> act = async () => await repository.GetInspectAsync(scope, "   ", CancellationToken.None);

        ArgumentException exception = (await act.Should().ThrowAsync<ArgumentException>()).Which;
        exception.ParamName.Should().Be("findingId");
        exception.Message.Should().Contain("Finding id is required.");
    }

    [Fact]
    public async Task GetInspectAsync_throws_when_finding_id_is_empty()
    {
        InMemoryFindingInspectReadRepository repository = new(new Mock<IAuthorityQueryService>().Object);
        ScopeContext scope = new();

        Func<Task> act = async () => await repository.GetInspectAsync(scope, string.Empty, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }
}
