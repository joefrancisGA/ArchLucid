using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;

/// <summary>
///     RC26 package-coverage batch for the ARCH006 tenant-scope family: SQL expression shapes the resolver must fold,
///     exemption discovery, <c>CommandDefinition</c> construction, and the analyzer's opt-out paths.
/// </summary>
/// <remarks>
///     Cases assert <em>no</em> diagnostics wherever possible: the scoped-table registry below only declares
///     <c>dbo.Runs</c> and <c>dbo.TenantSettings</c>, so probes that intentionally exercise resolver plumbing target
///     <c>dbo.Widgets</c> and stay diagnostic-free regardless of whether the SQL folds statically.
/// </remarks>
[Trait("Category", "Unit")]
public sealed class AnalyzersPackageCoverageBatchRc26Tests
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
        public TenantScopeExemptAttribute(TenantScopeExemptReason reason) { }

        public TenantScopeExemptAttribute(TenantScopeExemptReason reason, string justification) { }

        public string Justification { get; set; } = "";
    }
}

namespace Dapper
{
    public static class SqlMapper
    {
        // Extension methods, like real Dapper: the SQL is argument 0 of the reduced invocation.
        public static System.Collections.Generic.IEnumerable<T> Query<T>(
            this System.Data.IDbConnection cnn,
            string sql,
            object? param = null) =>
            throw null!;

        public static int Execute(this System.Data.IDbConnection cnn) => throw null!;
    }

    public sealed class CommandDefinition
    {
        public CommandDefinition() { }

        public CommandDefinition(string commandText) { }
    }
}

namespace ArchLucid.Persistence.Sql
{
    public static class RunChildRunScopeSql
    {
        // Deliberately not const: the resolver folds const fields before it reaches the marker branch.
        public static readonly string ScopeWhereClause =
            "run_scope.TenantId = @TenantId AND run_scope.WorkspaceId = @WorkspaceId AND run_scope.ScopeProjectId = @ScopeProjectId";

        public static string AndTripleWhere(string sql) => sql;

        public static string InnerJoinRuns(string sql) => sql;
    }

    public static class NotDapper
    {
        // Same method name as Dapper's, on an unrelated receiver, so the analyzer must reject it by containing type.
        public static System.Collections.Generic.IEnumerable<T> Query<T>(
            this string connectionName,
            string sql) =>
            throw null!;
    }
}

""";

    private const string RegistryJson = """
        {
          "scopeTripleOnRow": ["dbo.Runs"],
          "tenantIdOnRow": ["dbo.TenantSettings"]
        }
        """;

    private const string ScopedRunsSql =
        "SELECT c.Id FROM dbo.RunChildren c INNER JOIN dbo.Runs run_scope ON run_scope.RunId = c.RunId "
        + "WHERE run_scope.TenantId = @TenantId AND run_scope.WorkspaceId = @WorkspaceId "
        + "AND run_scope.ScopeProjectId = @ScopeProjectId";

    [Fact]
    public async Task ARCH006_accepts_command_definition_with_scope_bound_sql()
    {
        string testCode = Repository($$"""
    public void Load(IDbConnection connection)
    {
        _ = new CommandDefinition("{{ScopedRunsSql}}");
    }
""");

        await RunPersistenceAnalyzerTestAsync(testCode);
    }

    [Fact]
    public async Task ARCH006_ignores_command_definition_without_arguments()
    {
        const string testCode = """
    public void Load()
    {
        _ = new CommandDefinition();
    }
""";

        await RunPersistenceAnalyzerTestAsync(Repository(testCode));
    }

    [Fact]
    public async Task ARCH006_ignores_object_creation_of_unrelated_types()
    {
        const string testCode = """
    public void Load()
    {
        _ = new System.Text.StringBuilder("SELECT RunId FROM dbo.Runs");
    }
""";

        await RunPersistenceAnalyzerTestAsync(Repository(testCode));
    }

    [Fact]
    public async Task ARCH006_accepts_tenant_id_predicate_for_tenant_id_on_row_table()
    {
        const string testCode = """
    public void Load(IDbConnection connection)
    {
        _ = connection.Query<int>("SELECT Value FROM dbo.TenantSettings WHERE TenantId = @TenantId");
    }
""";

        await RunPersistenceAnalyzerTestAsync(Repository(testCode));
    }

    [Fact]
    public async Task ARCH006_folds_const_field_and_const_local_concatenation()
    {
        const string testCode = """
    private const string BaseSql = "SELECT Id FROM dbo.Widgets";

    public void Load(IDbConnection connection)
    {
        const string suffix = " WHERE Id = 1";

        _ = connection.Query<int>(BaseSql + suffix);
        _ = connection.Query<int>((BaseSql));
    }
""";

        await RunPersistenceAnalyzerTestAsync(Repository(testCode));
    }

    [Fact]
    public async Task ARCH006_folds_interpolated_string_with_static_and_dynamic_holes()
    {
        const string testCode = """
    private const string TableName = "dbo.Widgets";

    public void Load(IDbConnection connection, string filterColumn)
    {
        _ = connection.Query<int>($"SELECT Id FROM {TableName} WHERE Id = 1");
        _ = connection.Query<int>($"SELECT Id FROM dbo.Widgets WHERE {filterColumn} IS NULL");
    }
""";

        await RunPersistenceAnalyzerTestAsync(Repository(testCode));
    }

    [Fact]
    public async Task ARCH006_folds_string_concat_and_string_join_calls()
    {
        const string testCode = """
    public void Load(IDbConnection connection, string filterColumn)
    {
        _ = connection.Query<int>(string.Concat("SELECT Id ", "FROM dbo.Widgets"));
        _ = connection.Query<int>(string.Join(" ", "SELECT Id", "FROM dbo.Widgets"));
        _ = connection.Query<int>(string.Concat("SELECT Id FROM dbo.Widgets WHERE ", filterColumn));
    }
""";

        await RunPersistenceAnalyzerTestAsync(Repository(testCode));
    }

    [Fact]
    public async Task ARCH006_ignores_unanalyzable_sql_for_tables_outside_the_registry()
    {
        const string testCode = """
    public void Load(IDbConnection connection, string filterColumn)
    {
        _ = connection.Query<int>("SELECT Id FROM dbo.Widgets WHERE " + filterColumn + " IS NULL");
    }
""";

        await RunPersistenceAnalyzerTestAsync(Repository(testCode));
    }

    [Fact]
    public async Task ARCH006_accepts_recognized_scope_helper_invocation_on_dynamic_sql()
    {
        const string testCode = """
    public void Load(IDbConnection connection, string filterColumn)
    {
        _ = connection.Query<int>(
            RunChildRunScopeSql.AndTripleWhere("SELECT RunId FROM dbo.Runs WHERE " + filterColumn + " IS NULL"));

        _ = connection.Query<int>(
            RunChildRunScopeSql.InnerJoinRuns("SELECT RunId FROM dbo.Runs"));
    }
""";

        await RunPersistenceAnalyzerTestAsync(Repository(testCode));
    }

    [Fact]
    public async Task ARCH006_accepts_run_child_scope_where_clause_marker_field()
    {
        const string testCode = """
    public void Load(IDbConnection connection)
    {
        _ = connection.Query<int>(RunChildRunScopeSql.ScopeWhereClause);
    }
""";

        await RunPersistenceAnalyzerTestAsync(Repository(testCode));
    }

    [Fact]
    public async Task ARCH006_ignores_query_methods_that_are_not_dapper_sql_mapper()
    {
        const string testCode = """
    public void Load(IDbConnection connection)
    {
        _ = "conn".Query<int>("SELECT RunId FROM dbo.Runs");
        _ = connection.Execute();
        _ = Build("SELECT RunId FROM dbo.Runs");
    }

    private static string Build(string sql) => sql;
""";

        await RunPersistenceAnalyzerTestAsync(Repository(testCode));
    }

    [Fact]
    public async Task ARCH006_suppresses_findings_when_class_is_exempt_via_named_justification()
    {
        const string testCode = SharedStubs +
            """

namespace ArchLucid.Persistence.Probe
{
using System.Data;
using ArchLucid.Core.Tenancy;
using Dapper;

[TenantScopeExempt(TenantScopeExemptReason.Operational, Justification = "operational plane only")]
public sealed class ExemptRepository
{
    public void Load(IDbConnection connection)
    {
        _ = connection.Query<int>("SELECT RunId FROM dbo.Runs");
    }
}
}
""";

        await RunPersistenceAnalyzerTestAsync(testCode);
    }

    [Fact]
    public async Task ARCH006_suppresses_findings_when_method_is_exempt()
    {
        const string testCode = SharedStubs +
            """

namespace ArchLucid.Persistence.Probe
{
using System.Data;
using ArchLucid.Core.Tenancy;
using Dapper;

public sealed class MethodExemptRepository
{
    [TenantScopeExempt(TenantScopeExemptReason.SystemPlaneOnly, "system plane maintenance query")]
    public void Load(IDbConnection connection)
    {
        _ = connection.Query<int>("SELECT RunId FROM dbo.Runs");
    }
}
}
""";

        await RunPersistenceAnalyzerTestAsync(testCode);
    }

    [Fact]
    public async Task ARCH006_does_not_run_outside_the_persistence_assembly()
    {
        CSharpAnalyzerTest<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = Repository("""
    public void Load(IDbConnection connection)
    {
        _ = connection.Query<int>("SELECT RunId FROM dbo.Runs");
    }
"""),
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            TestState =
            {
                AdditionalFiles =
                {
                    ("tenant_scoped_tables.v1.json", Microsoft.CodeAnalysis.Text.SourceText.From(RegistryJson)),
                },
            },
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task ARCH006_does_not_run_without_the_scoped_table_registry_file()
    {
        CSharpAnalyzerTest<TenantScopedQueryScopeBindingAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = Repository("""
    public void Load(IDbConnection connection)
    {
        _ = connection.Query<int>("SELECT RunId FROM dbo.Runs");
    }
"""),
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidPersistence },
            TestState =
            {
                AdditionalFiles =
                {
                    // Wrong file name: the registry stays empty and the analyzer registers no actions.
                    ("unrelated_tables.json", Microsoft.CodeAnalysis.Text.SourceText.From(RegistryJson)),
                },
            },
        };

        await test.RunAsync();
    }

    /// <summary>Wraps a repository member body in the shared stub namespaces used by every case above.</summary>
    private static string Repository(string members)
    {
        return SharedStubs +
            $$"""

namespace ArchLucid.Persistence.Repositories
{
using System.Data;
using ArchLucid.Persistence.Sql;
using Dapper;

public sealed class ProbeRepository
{
{{members}}
}
}
""";
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
