using System.Reflection;

using ArchLucid.Core.Runs.Finalization;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Repositories;

/// <summary>
///     SQL error mapping contract for <see cref="ArchLucid.Persistence.Repositories.SqlManifestFinalizationRepository" />.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SqlManifestFinalizationRepositoryTests
{
    /// <summary>
    ///     <c>dbo.sp_FinalizeManifest</c> raises <b>50001</b> when the run row is missing or out of scope after locking.
    /// </summary>
    [Fact]
    public void MapSqlException_50001_maps_to_ManifestFinalizationFaultException()
    {
        Guid runId = Guid.NewGuid();

        Exception mapped = InvokeMapSqlException(50001, runId);

        ManifestFinalizationFaultException fault = mapped.Should().BeOfType<ManifestFinalizationFaultException>().Subject;
        fault.Kind.Should().Be(ManifestFinalizationFaultKind.RunNotFoundOrScope);
        fault.RunId.Should().Be(runId);
    }

    /// <summary>
    ///     <b>50002</b>: committed run already holds a different manifest (idempotent replay with divergent body).
    /// </summary>
    [Fact]
    public void MapSqlException_50002_maps_to_ManifestFinalizationFaultException()
    {
        Guid runId = Guid.NewGuid();

        Exception mapped = InvokeMapSqlException(50002, runId);

        ManifestFinalizationFaultException fault = mapped.Should().BeOfType<ManifestFinalizationFaultException>().Subject;
        fault.Kind.Should().Be(ManifestFinalizationFaultKind.CommittedDifferentManifest);
    }

    /// <summary>
    ///     <b>50003</b>: run is not in a commit-allowed legacy status at finalize time.
    /// </summary>
    [Fact]
    public void MapSqlException_50003_maps_to_ManifestFinalizationFaultException()
    {
        Guid runId = Guid.NewGuid();

        Exception mapped = InvokeMapSqlException(50003, runId);

        ManifestFinalizationFaultException fault = mapped.Should().BeOfType<ManifestFinalizationFaultException>().Subject;
        fault.Kind.Should().Be(ManifestFinalizationFaultKind.BadRunStatus);
    }

    /// <summary>
    ///     <b>50006</b>: optimistic concurrency on <c>RowVersionStamp</c> / expected row version — second commit loses.
    /// </summary>
    [Fact]
    public void MapSqlException_50006_maps_to_ManifestFinalizationFaultException()
    {
        Guid runId = Guid.NewGuid();

        Exception mapped = InvokeMapSqlException(50006, runId);

        ManifestFinalizationFaultException fault = mapped.Should().BeOfType<ManifestFinalizationFaultException>().Subject;
        fault.Kind.Should().Be(ManifestFinalizationFaultKind.ConcurrencyConflict);
    }

    /// <summary>
    ///     <b>50004</b>: findings snapshot on the run header does not match finalize inputs.
    /// </summary>
    [Fact]
    public void MapSqlException_50004_maps_to_ManifestFinalizationFaultException()
    {
        Guid runId = Guid.NewGuid();

        Exception mapped = InvokeMapSqlException(50004, runId);

        ManifestFinalizationFaultException fault = mapped.Should().BeOfType<ManifestFinalizationFaultException>().Subject;
        fault.Kind.Should().Be(ManifestFinalizationFaultKind.FindingsMismatch);
    }

    /// <summary>
    ///     <b>50005</b>: artifact bundle mismatch for finalize.
    /// </summary>
    [Fact]
    public void MapSqlException_50005_maps_to_ManifestFinalizationFaultException()
    {
        Guid runId = Guid.NewGuid();

        Exception mapped = InvokeMapSqlException(50005, runId);

        ManifestFinalizationFaultException fault = mapped.Should().BeOfType<ManifestFinalizationFaultException>().Subject;
        fault.Kind.Should().Be(ManifestFinalizationFaultKind.ArtifactMismatch);
    }

    /// <summary>
    ///     Unknown SQL errors remain <see cref="SqlException" /> so operators retain full diagnostic surfaces.
    /// </summary>
    [Fact]
    public void MapSqlException_unknown_number_returns_same_sql_exception()
    {
        Guid runId = Guid.NewGuid();

        Exception mapped = InvokeMapSqlException(99999, runId);

        mapped.Should().BeOfType<SqlException>();
    }

    private static Exception InvokeMapSqlException(int errorNumber, Guid runId)
    {
        SqlException ex = SqlExceptionTestFactory.Create(errorNumber);

        MethodInfo? method = typeof(ArchLucid.Persistence.Repositories.SqlManifestFinalizationRepository).GetMethod(
            "MapSqlException",
            BindingFlags.NonPublic | BindingFlags.Static);

        if (method is null)
            throw new InvalidOperationException("Expected internal static MapSqlException on SqlManifestFinalizationRepository.");

        return (Exception)method.Invoke(null, [ex, runId])!;
    }
}
