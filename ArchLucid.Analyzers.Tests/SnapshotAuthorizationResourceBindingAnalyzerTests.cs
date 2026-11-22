using System.Collections.Immutable;
using ArchLucid.Analyzers;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers.Tests;

public sealed class SnapshotAuthorizationResourceBindingAnalyzerTests
{
    private const string Prefix = """
        public sealed class Scope { public string TenantId = ""; public string WorkspaceId = "";
          public string ProjectId = ""; }
        public sealed class Run { public string RunId = ""; }
        public sealed class EvidenceReadAuthorizationGate {
          public bool AuthorizeAsync(object user, string tenant, string workspace,
              string project, string run, object ct) => true;
        }
        public sealed class GraphController {
          object User = new();
          object ct = new();
          Scope scope = new();
          Run resolved = new();
          string runId = "";
          string otherRun = "";
          EvidenceReadAuthorizationGate gate = new();
          public void GetArchitectureGraphTemporalSnapshot() {
        """;
    private const string Anchor =
        "gate.AuthorizeAsync(User, scope.TenantId, scope.WorkspaceId, scope.ProjectId, runId, ct);";
    private const string Resolved =
        "gate.AuthorizeAsync(User, scope.TenantId, scope.WorkspaceId, scope.ProjectId, resolved.RunId, ct);";

    private static async Task<ImmutableArray<Diagnostic>> Check(string body)
    {
        var compilation = CSharpCompilation.Create("ArchLucid.Api",
            new[] { CSharpSyntaxTree.ParseText(Prefix + body + "} }") },
            new[] { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) },
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
        return await compilation.WithAnalyzers(
            ImmutableArray.Create<DiagnosticAnalyzer>(
                new SnapshotAuthorizationResourceBindingAnalyzer()))
            .GetAnalyzerDiagnosticsAsync();
    }

    [Fact]
    public async Task Correct_anchor_and_resolved_binding_is_accepted() =>
        Assert.Empty(await Check(Anchor + Resolved));

    [Fact]
    public async Task Authorizing_anchor_twice_is_flagged() =>
        Assert.Contains(await Check(Anchor + Anchor), d => d.Id == "FND017005");

    [Fact]
    public async Task Foreign_run_id_is_flagged() =>
        Assert.Contains(await Check(Anchor.Replace("runId, ct", "otherRun, ct") + Resolved),
            d => d.Id == "FND017005");

    [Fact]
    public async Task Tenant_binding_mismatch_is_flagged() =>
        Assert.Contains(await Check(Anchor.Replace("scope.TenantId", "scope.ProjectId") + Resolved),
            d => d.Id == "FND017005");

    [Fact]
    public async Task Missing_resolved_gate_is_flagged() =>
        Assert.Contains(await Check(Anchor), d => d.Id == "FND017005");
}
