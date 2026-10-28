using System.Reflection;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Suite", "Persistence")]
[Trait("Category", "Performance")]
public sealed class ScopedOperationalFindingBatchingTests
{
    private static Guid[][] Batches(IEnumerable<Guid> ids)
    {
        MethodInfo? method = typeof(SqlOperationalSecurityFindingRepository).GetMethod(
            "BuildScopedFindingIdBatches", BindingFlags.NonPublic | BindingFlags.Static);
        method.Should().NotBeNull();
        return ((IEnumerable<Guid[]>)method!.Invoke(null, [ids])!).ToArray();
    }

    [Fact]
    public void LargeFindingRequest_HasBoundedSqlBatchesWithoutLosingIdentifiers()
    {
        Guid[] ids = Enumerable.Range(0, 1_205).Select(_ => Guid.NewGuid()).ToArray();

        Guid[][] batches = Batches(ids);

        batches.Select(batch => batch.Length).Should().Equal(500, 500, 205);
        batches.SelectMany(batch => batch).Should().BeEquivalentTo(ids);
        batches.Should().OnlyContain(batch => batch.Length + 3 < 2_100);
    }

    [Fact]
    public void DuplicatesAndEmptyIdentifiers_AreIgnored()
    {
        Guid first = Guid.NewGuid();
        Guid second = Guid.NewGuid();
        Guid[][] batches = Batches([Guid.Empty, first, second, first, Guid.Empty]);

        batches.Should().ContainSingle();
        batches[0].Should().Equal(first, second);
    }

    [Fact]
    public void NoValidIdentifiers_ProducesNoSqlBatches()
    {
        Batches([]).Should().BeEmpty();
        Batches([Guid.Empty]).Should().BeEmpty();
    }
}
