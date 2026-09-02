using ArchLucid.Persistence.Data.Repositories; using FluentAssertions;
namespace ArchLucid.Persistence.Tests.Repositories;
[Trait("Category","Unit")][Trait("Suite","Core")]
public sealed class DraftRequestRepositoryCoreTests {
 [Fact] public void NormalizeSystemName_uppercases()=>DraftRequestRepositoryCore.NormalizeSystemName(" abc ").Should().Be("ABC");
}
