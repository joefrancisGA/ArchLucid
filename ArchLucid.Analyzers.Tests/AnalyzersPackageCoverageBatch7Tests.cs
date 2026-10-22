using System.Collections.Immutable;
using System.Security.Claims;

using ArchLucid.Analyzers;

using FluentAssertions;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Diagnostics;
using Microsoft.CodeAnalysis.Text;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class AnalyzersPackageCoverageBatch7Tests
{
    [Fact]
    public void IsPrimaryKeyScopedMutation_true_for_single_pk_predicate_update()
    {
        const string sql = "UPDATE dbo.Runs SET Status = @Status WHERE RunId = @RunId";

        bool bound = TenantScopedQuerySqlInspector.IsPrimaryKeyScopedMutation(sql);

        bound.Should().BeTrue();
    }

    [Fact]
    public void IsPrimaryKeyScopedMutation_false_when_predicate_is_compound()
    {
        const string sql = "DELETE FROM dbo.Runs WHERE RunId = @RunId AND TenantId = @TenantId";

        bool bound = TenantScopedQuerySqlInspector.IsPrimaryKeyScopedMutation(sql);

        bound.Should().BeFalse();
    }

    [Fact]
    public void IsPrimaryKeyScopedMutation_false_for_select_statement()
    {
        const string sql = "SELECT RunId FROM dbo.Runs WHERE RunId = @RunId";

        bool bound = TenantScopedQuerySqlInspector.IsPrimaryKeyScopedMutation(sql);

        bound.Should().BeFalse();
    }

    [Fact]
    public void IsSingleSurrogateKeyRead_true_for_key_plus_soft_delete_filter()
    {
        const string sql = "SELECT PolicyPackId FROM dbo.PolicyPacks WHERE PolicyPackId = @PolicyPackId AND IsDeleted = 0";

        bool bound = TenantScopedQuerySqlInspector.IsSingleSurrogateKeyRead(sql);

        bound.Should().BeTrue();
    }

    [Fact]
    public void IsSingleSurrogateKeyRead_false_when_predicate_uses_a_range_comparison()
    {
        const string sql = "SELECT PolicyPackId FROM dbo.PolicyPacks WHERE PolicyPackId = @PolicyPackId AND CreatedUtc > @Since";

        bool bound = TenantScopedQuerySqlInspector.IsSingleSurrogateKeyRead(sql);

        bound.Should().BeFalse();
    }

    [Fact]
    public void IsSingleSurrogateKeyRead_false_when_statement_is_not_a_select()
    {
        const string sql = "UPDATE dbo.PolicyPacks SET IsDeleted = 1 WHERE PolicyPackId = @PolicyPackId";

        bool bound = TenantScopedQuerySqlInspector.IsSingleSurrogateKeyRead(sql);

        bound.Should().BeFalse();
    }

    [Fact]
    public void MergeIncludesTenantIdOnClause_true_when_on_clause_compares_tenant_id()
    {
        const string sql = """
            MERGE dbo.TenantSettings AS target
            USING (SELECT @TenantId AS TenantId) AS source
            ON target.TenantId = source.TenantId
            WHEN MATCHED THEN UPDATE SET SettingValue = @SettingValue;
            """;

        bool bound = TenantScopedQuerySqlInspector.MergeIncludesTenantIdOnClause(sql, "dbo.TenantSettings");

        bound.Should().BeTrue();
    }

    [Fact]
    public void MergeIncludesTenantIdOnClause_false_when_merge_targets_a_different_table()
    {
        const string sql = """
            MERGE dbo.Runs AS target
            USING (SELECT @TenantId AS TenantId) AS source
            ON target.TenantId = source.TenantId
            WHEN MATCHED THEN UPDATE SET Status = @Status;
            """;

        bool bound = TenantScopedQuerySqlInspector.MergeIncludesTenantIdOnClause(sql, "dbo.TenantSettings");

        bound.Should().BeFalse();
    }

    [Fact]
    public void HasCompoundWhereClause_true_when_where_clause_has_and()
    {
        const string sql = "SELECT 1 FROM dbo.Runs WHERE TenantId = @TenantId AND RunId = @RunId";

        bool compound = TenantScopedQuerySqlInspector.HasCompoundWhereClause(sql);

        compound.Should().BeTrue();
    }

    [Fact]
    public void HasCompoundWhereClause_false_when_where_clause_has_single_predicate()
    {
        const string sql = "SELECT 1 FROM dbo.Runs WHERE RunId = @RunId";

        bool compound = TenantScopedQuerySqlInspector.HasCompoundWhereClause(sql);

        compound.Should().BeFalse();
    }

    [Fact]
    public void HasCompoundWhereClause_false_when_statement_has_no_where_clause()
    {
        const string sql = "SELECT 1 FROM dbo.Runs";

        bool compound = TenantScopedQuerySqlInspector.HasCompoundWhereClause(sql);

        compound.Should().BeFalse();
    }

    [Fact]
    public void TenantScopedTableRegistry_LoadFromAdditionalFile_trims_bracketed_and_prefixed_entries()
    {
        const string json = """
            {
              "scopeTripleOnRow": ["dbo.Runs"],
              "tenantIdOnRow": []
            }
            """;

        TenantScopedTableRegistry registry = TenantScopedTableRegistry.LoadFromAdditionalFile(json);

        registry.RequiresTripleScope("dbo.Runs").Should().BeTrue();
        registry.RequiresTenantIdScope("dbo.Runs").Should().BeFalse();
        registry.IsTenantScoped("dbo.Findings").Should().BeFalse();
    }

    [Fact]
    public void TenantScopedTableRegistry_LoadFromAdditionalFile_returns_empty_for_blank_input()
    {
        TenantScopedTableRegistry registry = TenantScopedTableRegistry.LoadFromAdditionalFile("   ");

        registry.Should().BeSameAs(TenantScopedTableRegistry.Empty);
    }

    [Fact]
    public void TenantIdentityBoundaryTypeSymbols_Resolve_returns_no_types_when_unreferenced()
    {
        CSharpCompilation compilation = CreateCompilation(
            "class Probe { }",
            MetadataReference.CreateFromFile(typeof(object).Assembly.Location));

        TenantIdentityBoundaryTypeSymbols symbols = TenantIdentityBoundaryTypeSymbols.Resolve(compilation);

        symbols.HttpContext.Should().BeNull();
        symbols.IHttpContextAccessor.Should().BeNull();
        symbols.ClaimsPrincipal.Should().BeNull();
        symbols.AnyResolved.Should().BeFalse();
    }

    [Fact]
    public void TenantIdentityBoundaryTypeSymbols_Resolve_finds_claims_principal_when_referenced()
    {
        CSharpCompilation compilation = CreateCompilation(
            "class Probe { }",
            MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
            MetadataReference.CreateFromFile(typeof(ClaimsPrincipal).Assembly.Location));

        TenantIdentityBoundaryTypeSymbols symbols = TenantIdentityBoundaryTypeSymbols.Resolve(compilation);

        symbols.ClaimsPrincipal.Should().NotBeNull();
        symbols.HttpContext.Should().BeNull();
        symbols.AnyResolved.Should().BeTrue();
    }

    [Fact]
    public void MutatingControllerAuditAllowlist_ignores_additional_files_with_non_matching_name()
    {
        StringAdditionalText otherFile = new("other-file.txt", "ArchLucid.Api.Probe.Ignored.Action");
        AnalyzerOptions options = new(
            ImmutableArray.Create<AdditionalText>(otherFile),
            new EmptyAnalyzerConfigOptionsProvider());

        ImmutableHashSet<string> entries =
            MutatingControllerAuditAllowlist.ReadFqAllowlistEntries(options, CancellationToken.None);

        entries.Should().BeEmpty();
    }

    [Fact]
    public void MutatingControllerAuditAllowlist_skips_blank_lines_between_entries()
    {
        StringAdditionalText allowlist = new(
            MutatingControllerAuditAllowlist.AllowlistFileName,
            "\nArchLucid.Api.Probe.Solo.Action\n\n");
        AnalyzerOptions options = new(
            ImmutableArray.Create<AdditionalText>(allowlist),
            new EmptyAnalyzerConfigOptionsProvider());

        ImmutableHashSet<string> entries =
            MutatingControllerAuditAllowlist.ReadFqAllowlistEntries(options, CancellationToken.None);

        entries.Should().ContainSingle().Which.Should().Be("ArchLucid.Api.Probe.Solo.Action");
    }

    [Fact]
    public void TryAnalyzeForeach_matches_select_add_range_pattern()
    {
        const string source = """
            using System.Collections.Generic;

            class Probe
            {
                void M(List<int> source, List<int> target)
                {
                    foreach (int item in source)
                    {
                        target.Add(item);
                    }
                }
            }
            """;

        ForEachStatementSyntax foreachSyntax = GetForeachStatement(source, out SemanticModel model);

        ForeachToLinqMatch? match = ForeachToLinqAnalyzer.TryAnalyzeForeach(foreachSyntax, model, CancellationToken.None);

        match.Should().NotBeNull();
        match!.Value.Kind.Should().Be(ForeachToLinqKind.SelectAddRange);
        match.Value.WhereCondition.Should().BeNull();
    }

    [Fact]
    public void TryAnalyzeForeach_returns_null_for_discard_loop_variable()
    {
        const string source = """
            using System.Collections.Generic;

            class Probe
            {
                void M(List<int> source, List<int> target)
                {
                    foreach (int _ in source)
                    {
                        target.Add(1);
                    }
                }
            }
            """;

        ForEachStatementSyntax foreachSyntax = GetForeachStatement(source, out SemanticModel model);

        ForeachToLinqMatch? match = ForeachToLinqAnalyzer.TryAnalyzeForeach(foreachSyntax, model, CancellationToken.None);

        match.Should().BeNull();
    }

    [Fact]
    public void TryAnalyzeForeach_returns_null_when_body_has_multiple_statements()
    {
        const string source = """
            using System.Collections.Generic;

            class Probe
            {
                void M(List<int> source, List<int> target)
                {
                    foreach (int item in source)
                    {
                        target.Add(item);
                        target.Add(item);
                    }
                }
            }
            """;

        ForEachStatementSyntax foreachSyntax = GetForeachStatement(source, out SemanticModel model);

        ForeachToLinqMatch? match = ForeachToLinqAnalyzer.TryAnalyzeForeach(foreachSyntax, model, CancellationToken.None);

        match.Should().BeNull();
    }

    private static CSharpCompilation CreateCompilation(string source, params MetadataReference[] references)
    {
        SyntaxTree tree = CSharpSyntaxTree.ParseText(source);

        return CSharpCompilation.Create(
            "AnalyzersPackageCoverageBatch7_" + Guid.NewGuid().ToString("N"),
            [tree],
            references);
    }

    private static ForEachStatementSyntax GetForeachStatement(string source, out SemanticModel model)
    {
        CSharpCompilation compilation = CreateCompilation(
            source,
            MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
            MetadataReference.CreateFromFile(typeof(List<int>).Assembly.Location));
        SyntaxTree tree = compilation.SyntaxTrees[0];
        model = compilation.GetSemanticModel(tree);

        return tree.GetRoot().DescendantNodes().OfType<ForEachStatementSyntax>().First();
    }

    private sealed class StringAdditionalText(string path, string content) : AdditionalText
    {
        public override string Path => path;

        public override SourceText GetText(CancellationToken cancellationToken = default) =>
            SourceText.From(content);
    }

    private sealed class EmptyAnalyzerConfigOptionsProvider : AnalyzerConfigOptionsProvider
    {
        private static readonly EmptyAnalyzerConfigOptions Options = new();

        public override AnalyzerConfigOptions GlobalOptions => Options;

        public override AnalyzerConfigOptions GetOptions(SyntaxTree tree) => Options;

        public override AnalyzerConfigOptions GetOptions(AdditionalText textFile) => Options;
    }

    private sealed class EmptyAnalyzerConfigOptions : AnalyzerConfigOptions
    {
        public override bool TryGetValue(string key, out string value)
        {
            value = string.Empty;

            return false;
        }
    }
}
