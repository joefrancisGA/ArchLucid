using ArchLucid.Core.Persistence;
using ArchLucid.Host.Core.DataConsistency;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     CI guard: every committed run header evidence pointer on <c>dbo.Runs</c> must have a repoint probe.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CommittedRunHeaderFkRepointProbeRegistryArchitectureTests
{
    private static readonly HashSet<string> ExpectedPointerColumns = new(StringComparer.OrdinalIgnoreCase)
    {
        "ContextSnapshotId",
        "GraphSnapshotId",
        "FindingsSnapshotId",
        "GoldenManifestId",
        "DecisionTraceId",
        "ArtifactBundleId",
    };

    [Fact]
    public void Registry_covers_all_committed_run_header_evidence_pointers()
    {
        HashSet<string> registered = CommittedRunHeaderFkRepointRegistry.All
            .Select(static registration => registration.PointerColumnName)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        registered.Should().BeEquivalentTo(ExpectedPointerColumns);
    }

    [Fact]
    public void Every_registration_resolves_non_empty_count_sql()
    {
        foreach (CommittedRunHeaderFkRepointRegistration registration in CommittedRunHeaderFkRepointRegistry.All)
        {
            string sql = CommittedRunHeaderFkRepointProbeRegistry.ResolveCountSql(registration);

            sql.Should().Contain("dbo.Runs", because: "probe SQL must evaluate committed run headers");
            sql.Should().Contain(
                registration.PointerColumnName,
                because: $"probe SQL must reference dbo.Runs.{registration.PointerColumnName}");
            sql.Should().Contain(
                $"dbo.{registration.ChildTableName}",
                because: "probe SQL must join the child evidence table");
            sql.Should().Contain(
                registration.ChildPrimaryKeyColumn,
                because: "probe SQL must match the child primary key column");
            sql.Should().Contain(
                registration.ChildRunIdColumn,
                because: "probe SQL must compare child run ownership");
        }
    }

    [Fact]
    public void Data_consistency_matrix_documents_header_repoint_detection()
    {
        string matrix = File.ReadAllText(ResolveDataConsistencyMatrixPath());

        matrix.Should().Contain(nameof(CommittedRunHeaderFkRepointRegistry));
        matrix.Should().Contain("archlucid_data_consistency_header_repoints_detected_total");
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
