using ArchLucid.Persistence.Data.Infrastructure;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Infrastructure;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class DbUpMigrationStatusEvaluatorTests
{
    [Fact]
    public void FindPendingMigrationScriptNames_when_all_applied_returns_empty()
    {
        IReadOnlyList<string> required = DatabaseMigrator.GetOrderedMigrationResourceNames();

        IReadOnlyList<string> pending =
            DbUpMigrationStatusEvaluator.FindPendingMigrationScriptNames(required);

        pending.Should().BeEmpty();
    }

    [Fact]
    public void FindPendingMigrationScriptNames_when_journal_empty_returns_all_required()
    {
        IReadOnlyList<string> required = DatabaseMigrator.GetOrderedMigrationResourceNames();

        IReadOnlyList<string> pending =
            DbUpMigrationStatusEvaluator.FindPendingMigrationScriptNames([]);

        pending.Should().Equal(required);
    }

    [Fact]
    public void FindPendingMigrationScriptNames_is_case_insensitive()
    {
        IReadOnlyList<string> required = DatabaseMigrator.GetOrderedMigrationResourceNames();

        if (required.Count == 0)
            return;

        string first = required[0];
        HashSet<string> applied = required.Skip(1).ToHashSet(StringComparer.OrdinalIgnoreCase);
        applied.Add(first.ToUpperInvariant());

        IReadOnlyList<string> pending =
            DbUpMigrationStatusEvaluator.FindPendingMigrationScriptNames(applied);

        pending.Should().BeEmpty();
    }
}
