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

        public static System.Threading.Tasks.Task<int> ExecuteAsync(
            this System.Data.IDbConnection cnn,
            CommandDefinition command) =>
            throw null!;
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
            .WithSpan(50, 37, 50, 96)
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
