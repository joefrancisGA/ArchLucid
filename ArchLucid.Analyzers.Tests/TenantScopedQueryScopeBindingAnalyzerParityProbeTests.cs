using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;

/// <summary>
/// Isolated probes so SharedStubs line spans in the main analyzer test file stay stable.
/// </summary>
[Trait("Category", "Unit")]
public sealed class TenantScopedQueryScopeBindingAnalyzerParityProbeTests
{
    private const string MinimalStubs = """

namespace Dapper
{
    public static partial class SqlMapper
    {
        public static System.Threading.Tasks.Task<System.Collections.Generic.IEnumerable<T>> QueryAsync<T>(
            this System.Data.IDbConnection cnn,
            string sql,
            object? param = null,
            System.Data.IDbTransaction? transaction = null,
            int? commandTimeout = null,
            System.Data.CommandType? commandType = null) =>
            throw null!;

        public static System.Threading.Tasks.Task<System.Collections.Generic.IEnumerable<T>> QueryAsync<T>(
            this System.Data.IDbConnection cnn,
            CommandDefinition command) =>
            throw null!;

        public static System.Collections.Generic.IEnumerable<T> Query<T>(
            this System.Data.IDbConnection cnn,
            string sql,
            object? param = null,
            System.Data.IDbTransaction? transaction = null,
            bool buffered = true,
            int? commandTimeout = null,
            System.Data.CommandType? commandType = null) =>
            throw null!;

        public static System.Threading.Tasks.Task<int> ExecuteAsync(
            this System.Data.IDbConnection cnn,
            string sql,
            object? param = null,
            System.Data.IDbTransaction? transaction = null,
            int? commandTimeout = null,
            System.Data.CommandType? commandType = null) =>
            throw null!;

        public static System.Threading.Tasks.Task<int> ExecuteAsync(
            this System.Data.IDbConnection cnn,
            CommandDefinition command) =>
            throw null!;

        public static System.Threading.Tasks.Task<T> QueryFirstAsync<T>(
            this System.Data.IDbConnection cnn,
            string sql,
            object? param = null,
            System.Data.IDbTransaction? transaction = null,
            int? commandTimeout = null,
            System.Data.CommandType? commandType = null) =>
            throw null!;

        public static System.Threading.Tasks.Task<T> QuerySingleAsync<T>(
            this System.Data.IDbConnection cnn,
            string sql,
            object? param = null,
            System.Data.IDbTransaction? transaction = null,
            int? commandTimeout = null,
            System.Data.CommandType? commandType = null) =>
            throw null!;

        public static System.Threading.Tasks.Task<T?> QueryFirstOrDefaultAsync<T>(
            this System.Data.IDbConnection cnn,
            string sql,
            object? param = null,
            System.Data.IDbTransaction? transaction = null,
            int? commandTimeout = null,
            System.Data.CommandType? commandType = null) =>
            throw null!;

        public static System.Threading.Tasks.Task<T?> QuerySingleOrDefaultAsync<T>(
            this System.Data.IDbConnection cnn,
            string sql,
            object? param = null,
            System.Data.IDbTransaction? transaction = null,
            int? commandTimeout = null,
            System.Data.CommandType? commandType = null) =>
            throw null!;

        public static System.Threading.Tasks.Task<GridReader> QueryMultipleAsync(
            this System.Data.IDbConnection cnn,
            CommandDefinition command) =>
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
    public async Task ARCH006_does_not_analyze_query_async_local_command_definition_when_command_type_is_stored_procedure()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using System.Threading;
using Dapper;

public sealed class QueryAsyncLocalStoredProcCommandDefinitionRepository
{
    public async System.Threading.Tasks.Task LoadAsync(System.Data.IDbConnection connection, CancellationToken cancellationToken)
    {
        CommandDefinition command = new(
            "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL",
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);
        await connection.QueryAsync<int>(command);
    }
}
}
""";

        await RunPersistenceAnalyzerTestAsync(testCode);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_query_async_local_command_definition_when_not_stored_procedure()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class QueryAsyncLocalUnscopedCommandDefinitionRepository
{
    public async System.Threading.Tasks.Task LoadAsync(System.Data.IDbConnection connection)
    {
        CommandDefinition command = new("SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL");
        await connection.QueryAsync<int>(command);
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(115, 37, 115, 96)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_does_not_analyze_query_multiple_async_local_command_definition_when_command_type_is_stored_procedure()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using System.Threading;
using Dapper;

public sealed class QueryMultipleLocalStoredProcCommandDefinitionRepository
{
    public async System.Threading.Tasks.Task LoadAsync(System.Data.IDbConnection connection, CancellationToken cancellationToken)
    {
        CommandDefinition command = new(
            "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL",
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);
        await using SqlMapper.GridReader _ = await connection.QueryMultipleAsync(command);
    }
}
}
""";

        await RunPersistenceAnalyzerTestAsync(testCode);
    }

    [Fact]
    public async Task ARCH006_does_not_analyze_query_first_async_string_when_command_type_is_stored_procedure()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class QueryFirstAsyncStoredProcRepository
{
    public async System.Threading.Tasks.Task LoadAsync(System.Data.IDbConnection connection)
    {
        _ = await connection.QueryFirstAsync<int>(
            "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL",
            commandType: CommandType.StoredProcedure);
    }
}
}
""";

        await RunPersistenceAnalyzerTestAsync(testCode);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_execute_async_factory_command_definition()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class ExecuteAsyncFactoryCommandDefinitionRepository
{
    private static CommandDefinition BuildUnscoped() =>
        new("SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL");

    public async System.Threading.Tasks.Task LoadAsync(System.Data.IDbConnection connection)
    {
        await connection.ExecuteAsync(BuildUnscoped());
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(114, 9, 114, 68)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_execute_async_via_instance_method_command_definition_parameter()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class ExecuteAsyncViaParameterRepository
{
    private static void Execute(System.Data.IDbConnection connection, CommandDefinition command)
    {
        _ = connection.ExecuteAsync(command);
    }

    public void Load(System.Data.IDbConnection connection)
    {
        CommandDefinition command = new("SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL");
        Execute(connection, command);
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(120, 37, 120, 96)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_record_primary_constructor_sql_parameter()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed record PrimaryConstructorSqlRepository(string Sql = "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL")
{
    public void Load(System.Data.IDbConnection connection)
    {
        _ = connection.Query<int>(Sql);
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(115, 13, 115, 39)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_default_interface_method()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public interface DefaultInterfaceMethodSqlRepository
{
    void Load(System.Data.IDbConnection connection)
    {
        _ = connection.Query<int>("SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL");
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(115, 13, 115, 90)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_record_parameterless_ctor_chaining_to_primary()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed record ParameterlessCtorChainedSqlRepository(string Sql)
{
    public ParameterlessCtorChainedSqlRepository()
        : this("SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL")
    {
    }

    public void Load(System.Data.IDbConnection connection)
    {
        _ = connection.Query<int>(Sql);
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(120, 13, 120, 39)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_does_not_analyze_query_single_async_string_when_command_type_is_stored_procedure()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class QuerySingleAsyncStoredProcRepository
{
    public async System.Threading.Tasks.Task LoadAsync(System.Data.IDbConnection connection)
    {
        _ = await connection.QuerySingleAsync<int>(
            "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL",
            commandType: CommandType.StoredProcedure);
    }
}
}
""";

        await RunPersistenceAnalyzerTestAsync(testCode);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_command_definition_local_function_with_sql_parameter()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class LocalFunctionCommandDefinitionParameterRepository
{
    public async System.Threading.Tasks.Task LoadAsync(System.Data.IDbConnection connection)
    {
        CommandDefinition Build(string sql) => new(sql);
        await connection.ExecuteAsync(Build("SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL"));
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(115, 48, 115, 56)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_record_this_chain_with_static_field_argument()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed record StaticFieldChainedSqlRepository(string Sql)
{
    private static readonly string DefaultSql = "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL";

    public StaticFieldChainedSqlRepository()
        : this(DefaultSql)
    {
    }

    public void Load(System.Data.IDbConnection connection)
    {
        _ = connection.Query<int>(Sql);
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(122, 13, 122, 39)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_does_not_analyze_query_first_or_default_async_string_when_command_type_is_stored_procedure()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class QueryFirstOrDefaultStoredProcRepository
{
    public async System.Threading.Tasks.Task LoadAsync(System.Data.IDbConnection connection)
    {
        _ = await connection.QueryFirstOrDefaultAsync<int>(
            "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL",
            commandType: CommandType.StoredProcedure);
    }
}
}
""";

        await RunPersistenceAnalyzerTestAsync(testCode);
    }

    [Fact]
    public async Task ARCH006_does_not_analyze_when_local_function_command_definition_has_conflicting_call_site_sql()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class ConflictingLocalFunctionCommandDefinitionRepository
{
    public async System.Threading.Tasks.Task LoadAsync(System.Data.IDbConnection connection)
    {
        CommandDefinition Build(string sql) => new(sql);
        await connection.ExecuteAsync(Build("SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL"));
        await connection.ExecuteAsync(Build("SELECT TenantId FROM dbo.TenantSettings WHERE ArchivedUtc IS NULL"));
    }
}
}
""";

        await RunPersistenceAnalyzerTestAsync(testCode);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_partial_record_primary_constructor_default_on_sibling_partial()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed partial record PartialSiblingDefaultSqlRepository;

public sealed partial record PartialSiblingDefaultSqlRepository(string Sql = "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL")
{
    public void Load(System.Data.IDbConnection connection)
    {
        _ = connection.Query<int>(Sql);
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(117, 13, 117, 39)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_explicit_interface_implementation_method()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public interface IRunsReader
{
    void Load(System.Data.IDbConnection connection);
}

public sealed class ExplicitInterfaceSqlRepository : IRunsReader
{
    void IRunsReader.Load(System.Data.IDbConnection connection)
    {
        _ = connection.Query<int>("SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL");
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(120, 13, 120, 90)
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
