using System;
using System.Linq;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class TenantScopedSqlExpressionResolverCycleTests
{
    [Fact]
    public void Mutually_recursive_helpers_preserve_unscoped_sql_literal()
    {
        const string source = """
            namespace ArchLucid.Persistence;

            public static class SqlQueries
            {
                public static string SqlA() => SqlB();
                public static string SqlB() => "SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL " + SqlA();
                public static string Read() => SqlA();
            }
            """;

        TenantScopedSqlExpressionResolver.ResolutionResult result = ResolveReadExpression(source);

        Assert.True(result.IsStaticallyResolved);
        Assert.Contains("dbo.Runs", result.GetSqlTextsToAnalyze().Single());
        Assert.Contains("dbo.Runs", TenantScopedQuerySqlInspector.GetTopLevelScopedTargets(result.SqlText!));
    }

    [Fact]
    public void Recursive_switch_interpolation_keeps_literal_sql_without_overflow()
    {
        const string source = """
            namespace ArchLucid.Persistence;

            public static class SqlQueries
            {
                public static string SqlA(bool flag) => flag switch
                {
                    true => $"SELECT RunId FROM dbo.Runs WHERE ArchivedUtc IS NULL {SqlB()}",
                    false => "SELECT 1",
                };

                public static string SqlB() => SqlA(true);
                public static string Read() => SqlA(true);
            }
            """;

        TenantScopedSqlExpressionResolver.ResolutionResult result = ResolveReadExpression(source);

        Assert.True(result.IsStaticallyResolved);
        Assert.Contains(result.GetSqlTextsToAnalyze(), sql => sql.Contains("dbo.Runs", StringComparison.Ordinal));
    }

    [Fact]
    public void Recursive_helpers_without_literals_remain_unresolved()
    {
        const string source = """
            namespace ArchLucid.Persistence;

            public static class SqlQueries
            {
                public static string SqlA() => SqlB();
                public static string SqlB() => SqlA();
                public static string Read() => SqlA();
            }
            """;

        TenantScopedSqlExpressionResolver.ResolutionResult result = ResolveReadExpression(source);

        Assert.False(result.IsStaticallyResolved);
        Assert.Empty(result.GetSqlTextsToAnalyze());
    }

    private static TenantScopedSqlExpressionResolver.ResolutionResult ResolveReadExpression(string source)
    {
        SyntaxTree tree = CSharpSyntaxTree.ParseText(source);
        CSharpCompilation compilation = CSharpCompilation.Create(
            "SqlResolverCycleRegression",
            new[] { tree },
            new[] { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) },
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        MethodDeclarationSyntax method = tree.GetRoot().DescendantNodes()
            .OfType<MethodDeclarationSyntax>()
            .Single(candidate => candidate.Identifier.ValueText == "Read");

        return TenantScopedSqlExpressionResolver.Resolve(
            method.ExpressionBody!.Expression,
            compilation.GetSemanticModel(tree));
    }
}
