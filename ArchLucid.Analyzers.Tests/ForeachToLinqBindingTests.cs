using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers.Tests;

[Trait("Category", "Unit")]
public sealed class ForeachToLinqBindingTests
{
    [Theory]
    [InlineData("int[]", "List<int>", "target.Add(x + 1);", 1)]
    [InlineData("IEnumerable<int>", "List<int>", "if (x > 0) target.Add(x);", 1)]
    [InlineData("int[]", "NormalizingList", "target.Add(x + 1);", 0)]
    [InlineData("int[]", "BulkRejectingList", "if (x > 0) target.Add(x);", 0)]
    [InlineData("Span<int>", "List<int>", "target.Add(x + 1);", 0)]
    [InlineData("int[,]", "List<int>", "if (x > 0) target.Add(x);", 0)]
    public async Task Suggests_rewrites_only_for_supported_list_and_source_bindings(
        string sourceType, string targetType, string loopBody, int expectedDiagnostics)
    {
        string source = $$"""
                          using System;
                          using System.Collections.Generic;

                          sealed class NormalizingList : List<int>
                          {
                              public new void Add(int value) => base.Add(Math.Abs(value));
                          }

                          sealed class BulkRejectingList : List<int>
                          {
                              public new void AddRange(IEnumerable<int> values) => throw new NotSupportedException();
                          }

                          static class Accumulator
                          {
                              public static void M({{sourceType}} inputs, {{targetType}} target)
                              {
                                  foreach (int x in inputs)
                                      {{loopBody}}
                              }
                          }
                          """;
        CSharpCompilation compilation = CSharpCompilation.Create(
            "ArchLucid.Application",
            [CSharpSyntaxTree.ParseText(source)],
            [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        Assert.DoesNotContain(compilation.GetDiagnostics(), diagnostic => diagnostic.Severity == DiagnosticSeverity.Error);

        ImmutableArray<Diagnostic> diagnostics = await compilation
            .WithAnalyzers(ImmutableArray.Create<DiagnosticAnalyzer>(new ForeachToLinqAnalyzer()))
            .GetAnalyzerDiagnosticsAsync();

        Assert.Equal(expectedDiagnostics, diagnostics.Length);
        Assert.All(diagnostics, diagnostic => Assert.Equal("AL0002", diagnostic.Id));
    }
}
