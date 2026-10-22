using ArchLucid.Analyzers;

using FluentAssertions;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Diagnostics;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;

/// <summary>RC29c package-coverage batch: SQL inspector edges, resolver scope markers, and analyzer descriptor smoke.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AnalyzersPackageCoverageBatchRc29cTests
{
    [Fact]
    public void TenantScopedQuerySqlInspector_rejects_sql_without_scope_predicate()
    {
        TenantScopedQuerySqlInspector.HasTenantIdScopePredicate("SELECT RunId FROM dbo.Runs").Should().BeFalse();
        TenantScopedQuerySqlInspector.GetTopLevelScopedTargets("SELECT 1").Should().BeEmpty();
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_resolves_scope_where_clause_member_access()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult result =
            ResolveRightHandSide("RunChildRunScopeSql.ScopeWhereClause");

        result.IsStaticallyResolved.Should().BeTrue();
        result.HasScopeHelperInvocation.Should().BeTrue();
        result.SqlText.Should().Contain("TenantId = @TenantId");
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_partial_concat_is_not_statically_resolved()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult result =
            ResolveRightHandSide("\"SELECT RunId FROM \" + dynamicFragment");

        result.IsStaticallyResolved.Should().BeFalse();
    }

    [Theory]
    [InlineData(typeof(NakedDateTimeAnalyzer), "ARCH002")]
    [InlineData(typeof(ForeachToLinqAnalyzer), "AL0002")]
    [InlineData(typeof(RequireAuthorizationAnalyzer), "AL0001")]
    public void Analyzer_supported_diagnostics_expose_expected_rule_ids(Type analyzerType, string expectedRuleId)
    {
        DiagnosticAnalyzer analyzer = (DiagnosticAnalyzer)Activator.CreateInstance(analyzerType)!;

        analyzer.SupportedDiagnostics.Should().Contain(d => d.Id == expectedRuleId);
    }

    [Fact]
    public async Task MutableStaticAnalyzer_does_not_flag_private_setter_property()
    {
        const string testCode = """
namespace N;

public static class C
{
    public static int Prop { get; private set; }
}
""";

        CSharpAnalyzerTest<MutableStaticAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net80,
            SolutionTransforms = { ApplicationAssemblyNameTransform },
        };

        await test.RunAsync();
    }

    private static TenantScopedSqlExpressionResolver.ResolutionResult ResolveRightHandSide(string expression)
    {
        string source = "class Probe { void M() { string sql; sql = " + expression + "; } }";
        SyntaxTree tree = CSharpSyntaxTree.ParseText(source);
        SemanticModel model = CreateCompilation(tree).GetSemanticModel(tree);
        AssignmentExpressionSyntax assignment = tree
            .GetRoot()
            .DescendantNodes()
            .OfType<AssignmentExpressionSyntax>()
            .First();

        return TenantScopedSqlExpressionResolver.Resolve(assignment.Right, model);
    }

    private static CSharpCompilation CreateCompilation(SyntaxTree tree) =>
        CSharpCompilation.Create(
            "AnalyzersPackageCoverageBatchRc29c",
            [tree],
            [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

    private static Solution ApplicationAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Application");
}
