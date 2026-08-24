using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class TenantScopedQueryScopeBindingAnalyzerTests
{
    private const string SharedStubs = """

namespace ArchLucid.Core.Tenancy
{
    public enum TenantScopeExemptReason
    {
        AcceptedResidual = 0,
        SystemPlaneOnly = 1,
        Operational = 2,
    }

    [System.AttributeUsage(System.AttributeTargets.Class | System.AttributeTargets.Method, Inherited = true)]
    public sealed class TenantScopeExemptAttribute : System.Attribute
    {
        public TenantScopeExemptAttribute(TenantScopeExemptReason reason, string justification) { }
    }
}

namespace Dapper
{
    public static class SqlMapper
    {
        public static System.Collections.Generic.IEnumerable<T> Query<T>(
            System.Data.IDbConnection cnn,
            string sql,
            object? param = null,
            System.Data.IDbTransaction? transaction = null,
            bool buffered = true,
            int? commandTimeout = null,
            System.Data.CommandType? commandType = null) =>
            throw null!;

        public static System.Threading.Tasks.Task<GridReader> QueryMultipleAsync(
            this System.Data.IDbConnection cnn,
            string sql,
            object? param = null) =>
            throw null!;

        public sealed class GridReader : System.IAsyncDisposable
        {
            public System.Threading.Tasks.ValueTask DisposeAsync() => default;
        }
    }

    public sealed class CommandDefinition
    {
        public CommandDefinition(
            string command,
            object? parameters = null,
            System.Data.IDbTransaction? transaction = null,
            int? commandTimeout = null,
            System.Data.CommandType? commandType = null,
            System.Data.CommandBehavior flags = System.Data.CommandBehavior.Default,
            System.Threading.CancellationToken cancellationToken = default)
        {
        }
    }
}

""";

    private const string RegistryJson = """
        {
          "scopeTripleOnRow": ["dbo.Runs"],
          "tenantIdOnRow": ["dbo.TenantSettings"]
        }
        """;

    [Fact]
    public async Task ARCH006_reports_unscoped_static_sql_on_scoped_table()
    {
        const string testCode = SharedStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class UnscopedRunsRepository
{
    public void Load(IDbConnection connection)
    {
        _ = SqlMapper.Query<int>(
            connection,
            "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL");
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(68, 13, 70, 68)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_command_definition_named_command_argument()
    {
        const string testCode = SharedStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using System.Threading;
using Dapper;

public sealed class CommandDefinitionRunsRepository
{
    public void Load(IDbConnection connection, CancellationToken cancellationToken)
    {
        _ = new CommandDefinition(
            cancellationToken: cancellationToken,
            command: "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL");
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(69, 13, 71, 77)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006a_reports_unanalyzable_sql_for_bracketed_table_reference()
    {
        const string testCode = SharedStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class BracketedDynamicRunsRepository
{
    public void Load(IDbConnection connection, string filterColumn)
    {
        _ = SqlMapper.Query<int>(
            connection,
            "SELECT RunId FROM [dbo].[Runs] WHERE " + filterColumn + " IS NULL");
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnanalyzableSqlRule)
            .WithSpan(68, 13, 70, 81)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006b_reports_empty_exemption_justification()
    {
        const string testCode = SharedStubs +
            """

namespace ArchLucid.Persistence.Probe
{
using ArchLucid.Core.Tenancy;

[TenantScopeExempt(TenantScopeExemptReason.Operational, "")]
public sealed class BadExemptionRepository
{
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.EmptyExemptionJustificationRule)
            .WithSpan(63, 2, 63, 60)
            .WithArguments("ArchLucid.Persistence.Probe.BadExemptionRepository");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_static_sql_for_query_multiple_async()
    {
        const string testCode = SharedStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class QueryMultipleRunsRepository
{
    public async System.Threading.Tasks.Task LoadAsync(IDbConnection connection)
    {
        await using SqlMapper.GridReader _ = await connection.QueryMultipleAsync(
            "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL");
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(68, 52, 69, 68)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006a_reports_unanalyzable_sql_when_scoped_table_referenced()
    {
        const string testCode = SharedStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class DynamicRunsRepository
{
    public void Load(IDbConnection connection, string filterColumn)
    {
        _ = SqlMapper.Query<int>(
            connection,
            "SELECT RunId FROM dbo.Runs WHERE " + filterColumn + " IS NULL");
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnanalyzableSqlRule)
            .WithSpan(68, 13, 70, 77)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_non_const_local_variable()
    {
        const string testCode = SharedStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class LocalVariableRunsRepository
{
    public void Load(IDbConnection connection)
    {
        string sql = "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL";
        _ = SqlMapper.Query<int>(connection, sql);
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(69, 13, 69, 50)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_static_readonly_field()
    {
        const string testCode = SharedStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class StaticReadonlyRunsRepository
{
    private static readonly string UnscopedRunsSql =
        "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL";

    public void Load(IDbConnection connection)
    {
        _ = SqlMapper.Query<int>(connection, UnscopedRunsSql);
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(71, 13, 71, 62)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    private static async Task RunPersistenceAnalyzerTestAsync(
        string testCode,
        params DiagnosticResult[] expectedDiagnostics)
    {
        CSharpAnalyzerTest<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidPersistence },
            TestState =
            {
                AdditionalFiles =
                {
                    ("tenant_scoped_tables.v1.json", Microsoft.CodeAnalysis.Text.SourceText.From(RegistryJson)),
                },
            },
        };

        test.ExpectedDiagnostics.AddRange(expectedDiagnostics);

        await test.RunAsync();
    }

    private static Solution MarkAssemblyAsArchLucidPersistence(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Persistence");
}
