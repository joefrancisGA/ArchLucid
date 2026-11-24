using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EnumBoundaryReviewAnalyzerTests
{
    private static async Task<ImmutableArray<Diagnostic>> AnalyzeAsync(
        string source, string assemblyName = "ArchLucid.Application")
    {
        CSharpCompilation compilation = CSharpCompilation.Create(
            assemblyName,
            [CSharpSyntaxTree.ParseText(source)],
            [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        Assert.Empty(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error));
        return await compilation.WithAnalyzers(
            ImmutableArray.Create<DiagnosticAnalyzer>(new EnumBoundaryReviewAnalyzer()))
            .GetAnalyzerDiagnosticsAsync();
    }

    [Fact]
    public async Task Reports_raw_BCL_enum_parsing_and_runtime_casts()
    {
        const string source = """
            using System;
            enum Choice { A = 1, B = 2 }
            class C
            {
                void M(string text, int number)
                {
                    var a = Enum.Parse<Choice>(text);
                    var b = Enum.TryParse<Choice>(text, out _);
                    var c = (Choice)number;
                    var d = Enum.ToObject(typeof(Choice), number);
                    Enum.TryParse<Choice>(text, out _);
                }
            }
            """;
        var diagnostics = await AnalyzeAsync(source);
        Assert.Equal(4, diagnostics.Count(d => d.Id == "ENUM002"));
        Assert.Single(diagnostics.Where(d => d.Id == "ENUM001"));
        Assert.All(diagnostics.Where(d => d.Id == "ENUM002"),
            d => Assert.Equal(DiagnosticSeverity.Error, d.Severity));
    }

    [Fact]
    public async Task Does_not_flag_named_members_or_declared_constant_casts_or_unrelated_methods()
    {
        const string source = """
            enum Choice { A = 1, B = 2 }
            class Parser { public static Choice Parse(string text) => Choice.A; }
            class C
            {
                void M(string text)
                {
                    var a = Choice.A;
                    var b = (Choice)2;
                    var c = Parser.Parse(text);
                    Choice? nullable = Choice.A;
                    Choice? absent = null;
                }
            }
            """;
        Assert.Empty(await AnalyzeAsync(source));
    }

    [Fact]
    public async Task Reports_nullable_object_and_generic_casts_and_raw_method_groups()
    {
        const string source = """
            using System;
            enum Choice { A = 1, B = 2 }
            class C
            {
                void M(int? number, object boxed)
                {
                    var a = (Choice?)number;
                    var b = (Choice)boxed;
                    Func<string, Choice> parse = Enum.Parse<Choice>;
                    Choice invalid = 0;
                    Choice? absent = null;
                }
                T Cast<T>(object boxed) where T : struct, Enum => (T)boxed;
            }
            """;
        var diagnostics = await AnalyzeAsync(source);
        Assert.Single(diagnostics.Where(d => d.Id == "ENUM002"));
        Assert.Equal(4, diagnostics.Count(d => d.Id == "ENUM001"));
    }

    [Fact]
    public async Task Only_actual_contract_parser_is_exempt_from_raw_parsing()
    {
        const string source = """
            using System;
            namespace ArchLucid.Contracts.Serialization;
            enum Choice { A = 1 }
            class DefinedEnum { Choice Parse(string text) => Enum.Parse<Choice>(text); }
            """;
        Assert.Single((await AnalyzeAsync(source)).Where(d => d.Id == "ENUM002"));
        Assert.Empty(await AnalyzeAsync(source, "ArchLucid.Contracts"));
    }

    [Fact]
    public async Task Aliases_and_discard_assignments_do_not_escape_enforcement()
    {
        const string source = """
            using BclEnum = System.Enum;
            enum Choice { A = 1 }
            class C { void M(string raw) { _ = BclEnum.TryParse<Choice>(raw, out _); } }
            """;
        Assert.Single((await AnalyzeAsync(source)).Where(d => d.Id == "ENUM002"));
    }

    [Fact]
    public async Task Tests_are_not_product_boundary_enforcement_targets()
    {
        const string source = """
            using System;
            enum Choice { A = 1 }
            class C { Choice M(string text) => Enum.Parse<Choice>(text); }
            """;
        Assert.Empty(await AnalyzeAsync(source, "ArchLucid.Contracts.Tests"));
    }
}
