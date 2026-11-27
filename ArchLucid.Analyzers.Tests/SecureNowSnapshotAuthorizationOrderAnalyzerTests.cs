using System.Collections.Immutable;
using ArchLucid.Analyzers;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers.Tests;

public sealed class SecureNowSnapshotAuthorizationOrderAnalyzerTests
{
    private const string Types = """
        namespace Demo {
          public class Run {}
          public interface IRunRepository { Run GetByIdAsync(); }
          public interface IAuthorityQueryService { Run GetRunDetailAsync(); }
          public class EvidenceReadAuthorizationGate { public bool AuthorizeAsync() => true; }
        }
        """;

    private static async Task<ImmutableArray<Diagnostic>> AnalyzeAsync(string body)
    {
        var source = Types + """
            public class GraphController {
              private Demo.IRunRepository runRepository = null!;
              private Demo.IAuthorityQueryService authorityQueryService = null!;
              private Demo.EvidenceReadAuthorizationGate gate = null!;
              public void GetArchitectureGraphTemporalSnapshot() {
            """ + body + "} }";
        var compilation = CSharpCompilation.Create("ArchLucid.Api",
            new[] { CSharpSyntaxTree.ParseText(source) },
            new[] { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) },
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
        return await compilation.WithAnalyzers(
            ImmutableArray.Create<DiagnosticAnalyzer>(
                new SecureNowSnapshotAuthorizationOrderAnalyzer()))
            .GetAnalyzerDiagnosticsAsync();
    }

    [Theory]
    [InlineData("GetByIdAsync", true)]
    [InlineData("GetForRunAsync", false)]
    public async Task Application_bundle_reads_require_scoped_repository_method(string method, bool expected)
    {
        string source = "public interface IEvidenceBundleRepository { void GetByIdAsync(); void GetForRunAsync(); } " +
            "public class Consumer { public void Read(IEvidenceBundleRepository repo) { repo." + method + "(); } }";
        var compilation = CSharpCompilation.Create("ArchLucid.Application",
            new[] { CSharpSyntaxTree.ParseText(source) },
            new[] { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) },
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
        var result = await compilation.WithAnalyzers(ImmutableArray.Create<DiagnosticAnalyzer>(
            new SecureNowSnapshotAuthorizationOrderAnalyzer())).GetAnalyzerDiagnosticsAsync();
        Assert.Equal(expected, result.Any(x => x.Id == "FND017002"));
    }

    [Fact]
    public async Task Missing_gate_before_anchor_read_is_reported()
    {
        var result = await AnalyzeAsync("runRepository.GetByIdAsync();");
        Assert.Contains(result, x => x.Id == "FND017002");
    }

    [Fact]
    public async Task Gate_after_read_does_not_count()
    {
        var result = await AnalyzeAsync(
            "runRepository.GetByIdAsync(); gate.AuthorizeAsync();");
        Assert.Contains(result, x => x.Id == "FND017002");
    }

    [Fact]
    public async Task Two_gates_precede_resolved_detail()
    {
        var result = await AnalyzeAsync(
            "gate.AuthorizeAsync(); runRepository.GetByIdAsync(); " +
            "gate.AuthorizeAsync(); authorityQueryService.GetRunDetailAsync();");
        Assert.Empty(result);
    }

    [Fact]
    public async Task Resolved_detail_with_one_gate_is_reported()
    {
        var result = await AnalyzeAsync(
            "gate.AuthorizeAsync(); runRepository.GetByIdAsync(); " +
            "authorityQueryService.GetRunDetailAsync();");
        Assert.Contains(result, x => x.Id == "FND017002");
    }
}
