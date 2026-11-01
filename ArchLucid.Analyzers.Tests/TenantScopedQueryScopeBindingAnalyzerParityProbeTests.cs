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

        public static System.Threading.Tasks.Task<T?> ExecuteScalarAsync<T>(
            this System.Data.IDbConnection cnn,
            string sql,
            object? param = null,
            System.Data.IDbTransaction? transaction = null,
            int? commandTimeout = null,
            System.Data.CommandType? commandType = null) =>
            throw null!;

        public static System.Threading.Tasks.Task<System.Data.Common.DbDataReader> ExecuteReaderAsync(
            this System.Data.IDbConnection cnn,
            string sql,
            object? param = null,
            System.Data.IDbTransaction? transaction = null,
            int? commandTimeout = null,
            System.Data.CommandType? commandType = null) =>
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
            .WithSpan(149, 37, 149, 96)
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
            .WithSpan(148, 9, 148, 68)
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
            .WithSpan(154, 37, 154, 96)
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
            .WithSpan(149, 13, 149, 39)
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
            .WithSpan(149, 13, 149, 90)
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
            .WithSpan(154, 13, 154, 39)
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
            .WithSpan(149, 48, 149, 56)
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
            .WithSpan(156, 13, 156, 39)
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
            .WithSpan(151, 13, 151, 39)
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
            .WithSpan(154, 13, 154, 90)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_record_this_chain_with_parameterless_method_invocation_argument()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed record MethodInvocationChainedSqlRepository(string Sql)
{
    private static string BuildSql() => "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL";

    public MethodInvocationChainedSqlRepository()
        : this(BuildSql())
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
            .WithSpan(156, 13, 156, 39)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_does_not_analyze_query_single_or_default_async_string_when_command_type_is_stored_procedure()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class QuerySingleOrDefaultStoredProcRepository
{
    public async System.Threading.Tasks.Task LoadAsync(System.Data.IDbConnection connection)
    {
        _ = await connection.QuerySingleOrDefaultAsync<int>(
            "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL",
            commandType: CommandType.StoredProcedure);
    }
}
}
""";

        await RunPersistenceAnalyzerTestAsync(testCode);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_execute_async_string_when_local_function_command_definition_builder_is_never_called()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class DeadLocalFunctionCommandDefinitionRepository
{
    public async System.Threading.Tasks.Task LoadAsync(System.Data.IDbConnection connection)
    {
        CommandDefinition Build(string sql) => new(sql);
        await connection.ExecuteAsync("SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL");
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(150, 15, 150, 94)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_cross_file_partial_record_primary_constructor_default()
    {
        const string defaultFile =
            """

namespace ArchLucid.Persistence.Repositories
{
public sealed partial record CrossFileDefaultSqlRepository(
    string Sql = "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL");
}
""";

        const string loadFile =
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed partial record CrossFileDefaultSqlRepository
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
            .WithSpan("Load.cs", 11, 13, 11, 39)
            .WithArguments("dbo.Runs");

        CSharpAnalyzerTest<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier> test = new()
        {
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidPersistence },
            TestState =
            {
                AdditionalFiles =
                {
                    ("tenant_scoped_tables.v1.json", Microsoft.CodeAnalysis.Text.SourceText.From(RegistryJson)),
                },
                Sources =
                {
                    ("Stubs.cs", MinimalStubs),
                    ("Default.cs", defaultFile),
                    ("Load.cs", loadFile),
                },
            },
        };

        test.ExpectedDiagnostics.Add(expected);

        await test.RunAsync();
    }

    [Fact]
    public async Task ARCH006b_reports_empty_exemption_justification_on_explicit_interface_implementation_method()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using ArchLucid.Core.Tenancy;
using Dapper;

public interface IRunsReader
{
    void Load(System.Data.IDbConnection connection);
}

public sealed class ExplicitInterfaceBlankExemptionRepository : IRunsReader
{
    [TenantScopeExempt(TenantScopeExemptReason.Operational, "")]
    void IRunsReader.Load(System.Data.IDbConnection connection)
    {
        _ = connection.Query<int>("SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL");
    }
}
}
""";

        DiagnosticResult expectedExemption = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.EmptyExemptionJustificationRule)
            .WithSpan(153, 6, 153, 64)
            .WithArguments(
                "ArchLucid.Persistence.Repositories.ExplicitInterfaceBlankExemptionRepository.ArchLucid.Persistence.Repositories.IRunsReader.Load(System.Data.IDbConnection)");

        DiagnosticResult expectedUnscoped = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(156, 13, 156, 90)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expectedExemption, expectedUnscoped);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_record_this_chain_with_parameterized_method_invocation_argument()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System;
using System.Data;
using Dapper;

public sealed record ParameterizedMethodSqlRepository(string Sql)
{
    private static string FormatRunSql(Guid tenantId) =>
        "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL";

    public ParameterizedMethodSqlRepository(Guid tenantId)
        : this(FormatRunSql(tenantId))
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
            .WithSpan(158, 13, 158, 39)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_does_not_analyze_execute_scalar_async_string_when_command_type_is_stored_procedure()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class ExecuteScalarStoredProcRepository
{
    public async System.Threading.Tasks.Task LoadAsync(System.Data.IDbConnection connection)
    {
        _ = await connection.ExecuteScalarAsync<int>(
            "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL",
            commandType: CommandType.StoredProcedure);
    }
}
}
""";

        await RunPersistenceAnalyzerTestAsync(testCode);
    }

    [Fact]
    public async Task ARCH006_does_not_analyze_execute_reader_async_string_when_command_type_is_stored_procedure()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class ExecuteReaderStoredProcRepository
{
    public async System.Threading.Tasks.Task LoadAsync(System.Data.IDbConnection connection)
    {
        await using System.Data.Common.DbDataReader _ = await connection.ExecuteReaderAsync(
            "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL",
            commandType: CommandType.StoredProcedure);
    }
}
}
""";

        await RunPersistenceAnalyzerTestAsync(testCode);
    }

    [Fact]
    public async Task ARCH006_reports_unscoped_sql_for_command_definition_local_function_called_from_nested_local_function()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using Dapper;

public sealed class NestedLocalFunctionCommandDefinitionRepository
{
    public async System.Threading.Tasks.Task LoadAsync(System.Data.IDbConnection connection)
    {
        CommandDefinition Build(string sql) => new(sql);

        async System.Threading.Tasks.Task InnerAsync()
        {
            await connection.ExecuteAsync(Build("SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL"));
        }

        await InnerAsync();
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier>
            .Diagnostic(Arch006Descriptor.UnscopedTableRule)
            .WithSpan(149, 48, 149, 56)
            .WithArguments("dbo.Runs");

        await RunPersistenceAnalyzerTestAsync(testCode, expected);
    }

    [Fact]
    public async Task ARCH006_is_suppressed_when_explicit_interface_has_valid_tenant_scope_exemption()
    {
        const string testCode = MinimalStubs +
            """

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using ArchLucid.Core.Tenancy;
using Dapper;

public interface IRunsReader
{
    void Load(System.Data.IDbConnection connection);
}

public sealed class ExplicitInterfaceJustifiedExemptionRepository : IRunsReader
{
    [TenantScopeExempt(TenantScopeExemptReason.Operational, "Operational catalog read without tenant predicate.")]
    void IRunsReader.Load(System.Data.IDbConnection connection)
    {
        _ = connection.Query<int>("SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL");
    }
}
}
""";

        await RunPersistenceAnalyzerTestAsync(testCode);
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
