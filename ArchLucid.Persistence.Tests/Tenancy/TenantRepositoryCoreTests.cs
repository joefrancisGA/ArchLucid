using ArchLucid.Core.Tenancy; using ArchLucid.Persistence.Tenancy; using FluentAssertions;
namespace ArchLucid.Persistence.Tests.Tenancy;
[Trait("Category","Unit")][Trait("Suite","Core")]
public sealed class TenantRepositoryCoreTests {
 [Fact] public void NormalizeSlug_trims_and_lowercases()=>TenantRepositoryCore.NormalizeSlug("  Acme ").Should().Be("acme");
 [Fact] public void ClampErasureListTake_clamps()=>TenantRepositoryCore.ClampErasureListTake(500).Should().Be(100);
}
