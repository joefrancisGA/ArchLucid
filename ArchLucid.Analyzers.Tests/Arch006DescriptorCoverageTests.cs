using ArchLucid.Analyzers;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class Arch006DescriptorCoverageTests
{
    [Fact]
    public void Descriptor_ids_and_rules_are_initialized()
    {
        Assert.Equal("ARCH006", Arch006Descriptor.UnscopedTableId);
        Assert.Equal("ARCH006a", Arch006Descriptor.UnanalyzableSqlId);
        Assert.Equal("ARCH006b", Arch006Descriptor.EmptyExemptionJustificationId);
        Assert.Equal(Arch006Descriptor.UnscopedTableId, Arch006Descriptor.UnscopedTableRule.Id);
        Assert.Equal(Arch006Descriptor.UnanalyzableSqlId, Arch006Descriptor.UnanalyzableSqlRule.Id);
        Assert.Equal(Arch006Descriptor.EmptyExemptionJustificationId, Arch006Descriptor.EmptyExemptionJustificationRule.Id);
    }
}
