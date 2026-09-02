using ArchLucid.Persistence.IntegrationOutbox; using FluentAssertions;
namespace ArchLucid.Persistence.Tests.IntegrationOutbox;
[Trait("Category","Unit")][Trait("Suite","Core")]
public sealed class IntegrationEventOutboxRepositoryCoreTests {
 [Fact] public void ClampDequeueBatch_clamps()=>IntegrationEventOutboxRepositoryCore.ClampDequeueBatch(500).Should().Be(100);
}
