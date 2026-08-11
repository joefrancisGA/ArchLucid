using ArchLucid.Analyzers;

using FluentAssertions;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers.Tests;

/// <summary>
///     RC28f package-coverage batch: SQL expression resolver branches, scope predicate inspection, and ARCH rule descriptors.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AnalyzersPackageCoverageBatchRc28fTests
{
    [Fact]
    public void TenantScopedSqlExpressionResolver_resolves_interpolated_string_literal_segments()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult result =
            ResolveRightHandSide("$\"SELECT RunId FROM dbo.Runs WHERE TenantId = @TenantId\"");

        result.IsStaticallyResolved.Should().BeTrue();
        result.SqlText.Should().Contain("dbo.Runs");
        result.SqlText.Should().Contain("TenantId = @TenantId");
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_resolves_const_local_identifier()
    {
        TenantScopedSqlExpressionResolver.ResolutionResult result =
            ResolveRightHandSide(
                "filterColumn",
                "const string filterColumn = \"SELECT ArtifactId FROM dbo.Artifacts WHERE TenantId = @TenantId\";");

        result.IsStaticallyResolved.Should().BeTrue();
        result.SqlText.Should().Contain("dbo.Artifacts");
    }

    [Fact]
    public void TenantScopedSqlExpressionResolver_null_expression_is_not_statically_resolved()
    {
        SyntaxTree tree = CSharpSyntaxTree.ParseText("class Probe { void M() { } }");
        SemanticModel model = CreateCompilation(tree).GetSemanticModel(tree);

        TenantScopedSqlExpressionResolver.ResolutionResult result =
            TenantScopedSqlExpressionResolver.Resolve(null, model);

        result.IsStaticallyResolved.Should().BeFalse();
        result.SqlText.Should().BeNull();
    }

    [Fact]
    public void TenantScopedQuerySqlInspector_HasTenantIdScopePredicate_recognizes_scope_parameter()
    {
        const string sql = "SELECT RunId FROM dbo.Runs WHERE TenantId = @TenantId";

        TenantScopedQuerySqlInspector.HasTenantIdScopePredicate(sql).Should().BeTrue();
    }

    [Fact]
    public void TenantScopedQuerySqlInspector_GetTopLevelScopedTargets_ignores_subquery_tables()
    {
        const string sql = """
            SELECT r.RunId
            FROM dbo.Runs r
            WHERE r.TenantId = @TenantId
              AND r.RunId IN (SELECT ar.RunId FROM dbo.AgentResults ar);
            """;

        IReadOnlyList<string> targets = TenantScopedQuerySqlInspector.GetTopLevelScopedTargets(sql);

        targets.Should().Contain("dbo.Runs");
        targets.Should().NotContain("dbo.AgentResults");
    }

    [Theory]
    [InlineData(typeof(TenantIdentityBoundaryAnalyzer), "ARCH001")]
    [InlineData(typeof(MissingCancellationTokenAnalyzer), "ARCH003")]
    [InlineData(typeof(DirectHttpClientConstructionAnalyzer), "ARCH004")]
    [InlineData(typeof(MutableStaticAnalyzer), "ARCH005")]
    public void Analyzer_supported_diagnostics_expose_arch_rule_ids(Type analyzerType, string expectedRuleId)
    {
        DiagnosticAnalyzer analyzer = (DiagnosticAnalyzer)Activator.CreateInstance(analyzerType)!;

        analyzer.SupportedDiagnostics.Should().ContainSingle(d => d.Id == expectedRuleId);
    }

    private static TenantScopedSqlExpressionResolver.ResolutionResult ResolveRightHandSide(
        string expression,
        string preamble = "")
    {
        string source = "class Probe { void M() { "
            + preamble
            + " string sql; sql = "
            + expression
            + "; } }";
        SyntaxTree tree = CSharpSyntaxTree.ParseText(source);
        SemanticModel model = CreateCompilation(tree).GetSemanticModel(tree);
        AssignmentExpressionSyntax? assignment = tree.GetRoot()
            .DescendantNodes()
            .OfType<AssignmentExpressionSyntax>()
            .FirstOrDefault(node => node.IsKind(SyntaxKind.SimpleAssignmentExpression));

        return TenantScopedSqlExpressionResolver.Resolve(assignment?.Right, model);
    }

    private static TenantScopedSqlExpressionResolver.ResolutionResult ResolveRightHandSide(string expression) =>
        ResolveRightHandSide(expression, string.Empty);

    private static CSharpCompilation CreateCompilation(SyntaxTree tree) =>
        CSharpCompilation.Create(
            "AnalyzersPackageCoverageBatchRc28f",
            [tree],
            [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
}
