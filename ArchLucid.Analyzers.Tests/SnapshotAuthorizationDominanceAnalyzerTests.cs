using System.Collections.Immutable;
using ArchLucid.Analyzers;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers.Tests;

public sealed class SnapshotAuthorizationDominanceAnalyzerTests
{
    private static async Task<ImmutableArray<Diagnostic>> Analyze(string body)
    {
        var source = """
            namespace Demo {
              public class Run {}
              public interface IRunRepository { Run GetByIdAsync(); }
              public interface IAuthorityQueryService { Run GetRunDetailAsync(); }
              public class EvidenceReadAuthorizationGate { public bool AuthorizeAsync() => true; }
            }
            public class GraphController {
              private Demo.IRunRepository runRepository = null!;
              private Demo.IAuthorityQueryService authorityQueryService = null!;
              private Demo.EvidenceReadAuthorizationGate gate = null!;
              public object? GetArchitectureGraphTemporalSnapshot(bool condition) {
            """ + body + "\n} }";
        var compilation = CSharpCompilation.Create("ArchLucid.Api",
            new[] { CSharpSyntaxTree.ParseText(source) },
            new[] { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) },
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
        return await compilation.WithAnalyzers(
            ImmutableArray.Create<DiagnosticAnalyzer>(
                new SnapshotAuthorizationDominanceAnalyzer())).GetAnalyzerDiagnosticsAsync();
    }

    [Fact]
    public async Task Missing_gate_is_reported()
    {
        var diagnostics = await Analyze("return runRepository.GetByIdAsync();");
        Assert.Contains(diagnostics, d => d.Id == "FND017004");
    }

    [Fact]
    public async Task Conditional_gate_does_not_dominate_read()
    {
        var diagnostics = await Analyze(
            "if (condition) gate.AuthorizeAsync(); return runRepository.GetByIdAsync();");
        Assert.Contains(diagnostics, d => d.Id == "FND017004");
    }

    [Fact]
    public async Task Unconditional_gate_dominates_read()
    {
        var diagnostics = await Analyze(
            "gate.AuthorizeAsync(); return runRepository.GetByIdAsync();");
        Assert.Empty(diagnostics);
    }

    [Fact]
    public async Task Resolved_read_requires_second_gate()
    {
        var diagnostics = await Analyze(
            "gate.AuthorizeAsync(); runRepository.GetByIdAsync(); " +
            "return authorityQueryService.GetRunDetailAsync();");
        Assert.Contains(diagnostics, d => d.Id == "FND017004");
    }

    [Fact]
    public async Task Two_unconditional_gates_dominate_resolved_read()
    {
        var diagnostics = await Analyze(
            "gate.AuthorizeAsync(); runRepository.GetByIdAsync(); " +
            "gate.AuthorizeAsync(); return authorityQueryService.GetRunDetailAsync();");
        Assert.Empty(diagnostics);
    }
}
