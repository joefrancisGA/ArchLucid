using ArchLucid.Analyzers;

using FluentAssertions;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers.Tests;

/// <summary>RC29e package-coverage batch: foreach WhereAddRange, SQL resolver concat/interpolation branches.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AnalyzersPackageCoverageBatchRc29eTests
{
    [Fact]
    public void TryAnalyzeForeach_matches_where_add_range_pattern()
    {
        const string source = """
            using System.Collections.Generic;

            class Probe
            {
                void M(List<int> source, List<int> target)
                {
                    foreach (int item in source)
                    {
                        if (item > 0)
                            target.Add(item);
                    }
                }
            }
            """;

        ForEachStatementSyntax foreachSyntax = GetForeachStatement(source, out SemanticModel model);

        ForeachToLinqMatch? match = ForeachToLinqAnalyzer.TryAnalyzeForeach(foreachSyntax, model, CancellationToken.None);

        match.Should().NotBeNull();
        match!.Value.Kind.Should().Be(ForeachToLinqKind.WhereAddRange);
        match.Value.WhereCondition.Should().NotBeNull();
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_resolves_binary_string_concatenation()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult result =
            ResolveRightHandSide("\"SELECT RunId FROM dbo.Runs WHERE \" + \"TenantId = @TenantId\"");

        result.IsStaticallyResolved.Should().BeTrue();
        result.SqlText.Should().Contain("TenantId = @TenantId");
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_resolves_string_concat_invocation()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult result =
            ResolveRightHandSide("string.Concat(\"SELECT RunId FROM dbo.Runs WHERE \", \"TenantId = @TenantId\")");

        result.IsStaticallyResolved.Should().BeTrue();
        result.SqlText.Should().Contain("dbo.Runs");
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_resolves_interpolated_sql_with_scope_marker()
    {
        const string source = """
            class RunChildRunScopeSql
            {
                public const string ScopeWhereClause = "TenantId = @TenantId";
            }

            class Probe
            {
                void M()
                {
                    string sql;
                    sql = $"SELECT RunId FROM dbo.Runs WHERE {RunChildRunScopeSql.ScopeWhereClause}";
                }
            }
            """;

        TenantScopedSqlExpressionResolver.ResolutionResult result = ResolveAssignmentRight(source);

        result.IsStaticallyResolved.Should().BeTrue();
        result.SqlText.Should().Contain("TenantId = @TenantId");
    }

    [Theory]
    [InlineData(typeof(MutatingControllerAuditAnalyzer), "AL0003")]
    [InlineData(typeof(TenantIdentityBoundaryAnalyzer), "ARCH001")]
    [InlineData(typeof(TenantScopedQueryScopeBindingAnalyzer), "ARCH006")]
    [InlineData(typeof(ForeachToLinqAnalyzer), "AL0002")]
    public void Analyzer_supported_diagnostics_include_expected_rule_ids(Type analyzerType, string expectedRuleId)
    {
        DiagnosticAnalyzer analyzer = (DiagnosticAnalyzer)Activator.CreateInstance(analyzerType)!;

        analyzer.SupportedDiagnostics.Should().Contain(d => d.Id == expectedRuleId);
    }

    private static TenantScopedSqlExpressionResolver.ResolutionResult ResolveRightHandSide(string expression)
    {
        string source = "class Probe { void M() { string sql; sql = " + expression + "; } }";
        return ResolveAssignmentRight(source);
    }

    private static TenantScopedSqlExpressionResolver.ResolutionResult ResolveAssignmentRight(string source)
    {
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
            "AnalyzersPackageCoverageBatchRc29e",
            [tree],
            [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

    private static ForEachStatementSyntax GetForeachStatement(string source, out SemanticModel model)
    {
        CSharpCompilation compilation = CreateCompilation(
            CSharpSyntaxTree.ParseText(source),
            MetadataReference.CreateFromFile(typeof(List<int>).Assembly.Location));
        SyntaxTree tree = compilation.SyntaxTrees[0];
        model = compilation.GetSemanticModel(tree);

        return tree.GetRoot().DescendantNodes().OfType<ForEachStatementSyntax>().First();
    }

    private static CSharpCompilation CreateCompilation(SyntaxTree tree, MetadataReference extraReference)
    {
        return CSharpCompilation.Create(
            "AnalyzersPackageCoverageBatchRc29e_" + Guid.NewGuid().ToString("N"),
            [tree],
            [
                MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
                extraReference,
            ],
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
    }
}
