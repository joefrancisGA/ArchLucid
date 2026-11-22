using System.Collections.Immutable;
using ArchLucid.Analyzers;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers.Tests;

public sealed class AuthorizationDecisionConsumptionAnalyzerTests
{
    private static async Task<ImmutableArray<Diagnostic>> Check(string body)
    {
        string source = """
            using System.Threading.Tasks;
            namespace ArchLucid.Api.Security {
              public class EvidenceReadDecision { public bool Allowed { get; set; } }
              public class EvidenceReadAuthorizationGate {
                public Task<EvidenceReadDecision> AuthorizeAsync() =>
                  Task.FromResult(new EvidenceReadDecision());
              }
            }
            public class GraphController {
              private ArchLucid.Api.Security.EvidenceReadAuthorizationGate gate = new();
              public async Task<object?> GetArchitectureGraphTemporalSnapshot() {
            """ + body + "\n} }";
        var compilation = CSharpCompilation.Create("ArchLucid.Api",
            new[] { CSharpSyntaxTree.ParseText(source) },
            new[] {
                MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
                MetadataReference.CreateFromFile(typeof(Task).Assembly.Location)
            }, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
        return await compilation.WithAnalyzers(
            ImmutableArray.Create<DiagnosticAnalyzer>(
                new AuthorizationDecisionConsumptionAnalyzer())).GetAnalyzerDiagnosticsAsync();
    }

    [Fact]
    public async Task Ignored_result_is_flagged()
    {
        var diagnostics = await Check("await gate.AuthorizeAsync(); return new object();");
        Assert.Contains(diagnostics, d => d.Id == "FND017003");
    }

    [Fact]
    public async Task Unchecked_assigned_result_is_flagged()
    {
        var diagnostics = await Check(
            "var access = await gate.AuthorizeAsync(); return new object();");
        Assert.Contains(diagnostics, d => d.Id == "FND017003");
    }

    [Fact]
    public async Task Immediate_denial_return_is_accepted()
    {
        var diagnostics = await Check(
            "var access = await gate.AuthorizeAsync(); if (!access.Allowed) return null; return new object();");
        Assert.Empty(diagnostics);
    }

    [Fact]
    public async Task Nonterminating_denial_branch_is_flagged()
    {
        var diagnostics = await Check(
            "var access = await gate.AuthorizeAsync(); if (!access.Allowed) { var x = 1; } return new object();");
        Assert.Contains(diagnostics, d => d.Id == "FND017003");
    }

    [Fact]
    public async Task Intervening_statement_does_not_satisfy_guard()
    {
        var diagnostics = await Check(
            "var access = await gate.AuthorizeAsync(); var x = 1; if (!access.Allowed) return null; return new object();");
        Assert.Contains(diagnostics, d => d.Id == "FND017003");
    }
}
