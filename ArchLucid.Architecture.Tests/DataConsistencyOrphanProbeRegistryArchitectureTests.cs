using System.Text.RegularExpressions;

using ArchLucid.Host.Core.DataConsistency;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     CI guard: every <c>dbo.*</c> table with an explicit <c>FK_*_Runs_RunId</c> in greenfield DDL must appear in
///     <see cref="DataConsistencyOrphanProbeRegistry" /> (probed or documented opt-out).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DataConsistencyOrphanProbeRegistryArchitectureTests
{
    private static readonly Regex RunForeignKeyTableRegex = new(
        @"FK_(?<table>\w+)_Runs_RunId\b",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase | RegexOptions.Compiled);

    [Fact]
    public void ArchLucid_sql_RunId_foreign_key_tables_are_registered_in_orphan_probe_registry()
    {
        string sql = File.ReadAllText(ResolveArchLucidSqlPath());
        HashSet<string> ddlTables = ExtractRunForeignKeyTables(sql);
        HashSet<string> registeredTables = DataConsistencyOrphanProbeRegistry.All
            .Select(static registration => registration.TableName)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        ddlTables.Should().NotBeEmpty("ArchLucid.sql should declare at least one FK_*_Runs_RunId constraint");

        foreach (string table in ddlTables.OrderBy(static name => name, StringComparer.OrdinalIgnoreCase))
        {
            registeredTables.Should().Contain(
                table,
                because: $"dbo.{table} gained a RunId FK and must be registered in {nameof(DataConsistencyOrphanProbeRegistry)}");
        }
    }

    [Fact]
    public void Background_probed_registrations_resolve_non_empty_count_sql()
    {
        foreach (DataConsistencyOrphanProbeRegistration registration in DataConsistencyOrphanProbeRegistry.BackgroundProbed)
        {
            string sql = DataConsistencyOrphanProbeRegistry.ResolveBackgroundProbeCountSql(registration);

            sql.Should().Contain($"dbo.{registration.TableName}", because: "probe SQL must target the registered table");
            sql.Should().Contain("dbo.Runs", because: "probe SQL must reference authority parent dbo.Runs");
            sql.Should().Contain(registration.ColumnName, because: "probe SQL must reference the registered column");
        }
    }

    [Fact]
    public void Opt_out_registrations_include_rationale()
    {
        IEnumerable<DataConsistencyOrphanProbeRegistration> optOuts = DataConsistencyOrphanProbeRegistry.All
            .Where(static registration => !registration.IsBackgroundProbed);

        foreach (DataConsistencyOrphanProbeRegistration registration in optOuts)
        {
            registration.OptOutRationale.Should().NotBeNullOrWhiteSpace(
                because: $"dbo.{registration.TableName} must document why it is not background-probed");
        }
    }

    [Fact]
    public void Data_consistency_matrix_documents_background_probed_orphan_tables()
    {
        string matrix = File.ReadAllText(ResolveDataConsistencyMatrixPath());

        matrix.Should().Contain(nameof(DataConsistencyOrphanProbeRegistry), because: "matrix should link to the registry");

        foreach (DataConsistencyOrphanProbeRegistration registration in DataConsistencyOrphanProbeRegistry.BackgroundProbed)
        {
            matrix.Should().Contain(
                registration.TableName,
                because: $"matrix should mention background-probed dbo.{registration.TableName}");
        }
    }

    private static HashSet<string> ExtractRunForeignKeyTables(string sql)
    {
        HashSet<string> tables = new(StringComparer.OrdinalIgnoreCase);

        foreach (Match match in RunForeignKeyTableRegex.Matches(sql))
        {
            if (!match.Success)
                continue;

            tables.Add(match.Groups["table"].Value);
        }

        return tables;
    }

    private static string ResolveArchLucidSqlPath()
    {
        return ResolveRepoRelativePath("ArchLucid.Persistence", "Scripts", "ArchLucid.sql");
    }

    private static string ResolveDataConsistencyMatrixPath()
    {
        return ResolveRepoRelativePath("docs", "library", "DATA_CONSISTENCY_MATRIX.md");
    }

    private static string ResolveRepoRelativePath(params string[] relativeSegments)
    {
        string[] seeds = [AppContext.BaseDirectory, Directory.GetCurrentDirectory(),];

        foreach (string seed in seeds)
        {
            string dir = Path.GetFullPath(seed);

            for (int depth = 0; depth < 16 && !string.IsNullOrEmpty(dir); depth++)
            {
                string candidate = Path.Combine(new[] { dir }.Concat(relativeSegments).ToArray());

                if (File.Exists(candidate))
                    return candidate;

                string? parent = Path.GetDirectoryName(dir);

                if (string.IsNullOrEmpty(parent) || string.Equals(parent, dir, StringComparison.Ordinal))
                    break;

                dir = parent;
            }
        }

        throw new InvalidOperationException(
            $"Could not locate {string.Join('/', relativeSegments)}. Run tests from repo root.");
    }
}
