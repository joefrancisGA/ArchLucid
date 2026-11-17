using System.Reflection;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Suite", "Persistence")]
[Trait("Category", "Performance")]
public sealed class ScopedSecurityEvidencePathBatchingTests
{
    private static Guid[][] Batches(IEnumerable<Guid> ids)
    {
        MethodInfo method = typeof(SqlSecurityEvidencePathRepository).GetMethod(
            "BuildScopedPathIdBatches", BindingFlags.NonPublic | BindingFlags.Static)!;
        method.Should().NotBeNull();
        return ((IEnumerable<Guid[]>)method.Invoke(null, [ids])!).ToArray();
    }

    [Fact]
    public void LargePathRequest_StaysWithinSqlParameterLimitAndPreservesAllIds()
    {
        Guid[] ids = Enumerable.Range(0, 1_205).Select(_ => Guid.NewGuid()).ToArray();

        Guid[][] batches = Batches(ids);

        batches.Should().HaveCount(3);
        batches.Select(batch => batch.Length).Should().Equal(500, 500, 205);
        batches.SelectMany(batch => batch).Should().BeEquivalentTo(ids);
        batches.Should().OnlyContain(batch => batch.Length + 3 < 2_100);
    }

    [Fact]
    public void DuplicateAndEmptyIds_AreOmittedBeforeBatching()
    {
        Guid first = Guid.NewGuid();
        Guid second = Guid.NewGuid();
        Guid[][] batches = Batches([Guid.Empty, first, first, Guid.Empty, second]);

        batches.Should().ContainSingle();
        batches[0].Should().Equal(first, second);
    }

    [Fact]
    public void EmptyRequest_ProducesNoBatches()
    {
        Batches([]).Should().BeEmpty();
        Batches([Guid.Empty]).Should().BeEmpty();
    }
}
