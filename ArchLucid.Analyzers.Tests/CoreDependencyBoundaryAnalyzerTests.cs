using System.Collections.Immutable;
using ArchLucid.Analyzers;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Diagnostics;

namespace ArchLucid.Analyzers.Tests;

public sealed class CoreDependencyBoundaryAnalyzerTests
{
    private static async Task<ImmutableArray<Diagnostic>> AnalyzeAsync(
        string assemblyName, string source, string dependencyAssemblyName)
    {
        var options = new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary);
        var dependency = CSharpCompilation.Create(dependencyAssemblyName,
            new[] { CSharpSyntaxTree.ParseText(
                "namespace Forbidden { public class SecretService { public static void Touch() {} public static int Number => 1; } }") },
            new[] { MetadataReference.CreateFromFile(typeof(object).Assembly.Location) },
            options);
        using var stream = new System.IO.MemoryStream();
        var emit = dependency.Emit(stream);
        Assert.True(emit.Success, string.Join(";", emit.Diagnostics));
        var reference = MetadataReference.CreateFromImage(stream.ToArray());
        var compilation = CSharpCompilation.Create(assemblyName,
            new[] { CSharpSyntaxTree.ParseText(source) },
            new[] { MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
                    reference }, options);
        return await compilation.WithAnalyzers(
            ImmutableArray.Create<DiagnosticAnalyzer>(new CoreDependencyBoundaryAnalyzer()))
            .GetAnalyzerDiagnosticsAsync();
    }

    [Fact]
    public async Task Core_referencing_persistence_type_reports_boundary()
    {
        var diagnostics = await AnalyzeAsync("ArchLucid.Core",
            "using Forbidden; public class X { public SecretService Service = new(); }",
            "ArchLucid.Persistence");
        Assert.Contains(diagnostics, d => d.Id == "FND017001");
    }

    [Theory]
    [InlineData("using Forbidden; public class X { public void Run() { SecretService.Touch(); } }")]
    [InlineData("using Forbidden; public class X { public int Read() => SecretService.Number; }")]
    public async Task Core_static_member_only_reference_reports_boundary(string source)
    {
        // No field, parameter, new-expression or typeof introduces this type:
        // its only use is as the receiver of a static member access.
        var diagnostics = await AnalyzeAsync("ArchLucid.Core", source,
            "ArchLucid.Persistence");
        Assert.Single(diagnostics.Where(d => d.Id == "FND017001"));
    }

    [Fact]
    public async Task Independent_static_member_receiver_is_allowed()
    {
        var diagnostics = await AnalyzeAsync("ArchLucid.Core",
            "using Forbidden; public class X { public void Run() { SecretService.Touch(); } }",
            "ArchLucid.Contracts");
        Assert.Empty(diagnostics);
    }

    [Fact]
    public async Task Core_alias_cannot_bypass_boundary()
    {
        var diagnostics = await AnalyzeAsync("ArchLucid.Core",
            "using S = Forbidden.SecretService; public class X { public S Service = new(); }",
            "ArchLucid.Api");
        Assert.Contains(diagnostics, d => d.Id == "FND017001");
    }

    [Fact]
    public async Task Api_host_is_not_subject_to_core_rule()
    {
        var diagnostics = await AnalyzeAsync("ArchLucid.Api",
            "using Forbidden; public class X { public SecretService Service = new(); }",
            "ArchLucid.Persistence");
        Assert.Empty(diagnostics);
    }

    [Theory]
    [InlineData("ArchLucid.Host.Composition")]
    [InlineData("ArchLucid.Host.Core")]
    public async Task Core_referencing_host_implementation_reports_boundary(string hostAssembly)
    {
        var diagnostics = await AnalyzeAsync("ArchLucid.Core",
            "using Forbidden; public class X { public SecretService Service = new(); }",
            hostAssembly);
        Assert.Contains(diagnostics, d => d.Id == "FND017001");
    }

    [Fact]
    public async Task Core_does_not_flag_forbidden_namespace_in_allowed_assembly()
    {
        // The rule must check resolved assembly identity, not matching namespace text.
        var diagnostics = await AnalyzeAsync("ArchLucid.Core",
            "using Forbidden; public class X { public SecretService Service = new(); }",
            "ArchLucid.Contracts");
        Assert.Empty(diagnostics);
    }

    [Fact]
    public void Core_project_is_wired_to_analyzer_and_has_scoped_enforcement()
    {
        DirectoryInfo? directory = new(Directory.GetCurrentDirectory());
        for (; directory is not null; directory = directory.Parent)
        {
            string coreProject = Path.Combine(directory.FullName, "ArchLucid.Core", "ArchLucid.Core.csproj");
            string coreConfig = Path.Combine(directory.FullName, "ArchLucid.Core", ".editorconfig");
            if (!File.Exists(coreProject))
                continue;

            Assert.True(File.Exists(coreConfig), "Core must have a scoped diagnostic-severity configuration");
            string projectText = File.ReadAllText(coreProject);
            string configText = File.ReadAllText(coreConfig);
            Assert.Contains("ArchLucid.Analyzers.csproj", projectText);
            Assert.Contains("OutputItemType=\"Analyzer\"", projectText);
            Assert.Contains("dotnet_diagnostic.FND017001.severity = error", configText);
            Assert.DoesNotContain("dotnet_diagnostic.FND017002.severity = error", configText);
            Assert.DoesNotContain("dotnet_diagnostic.FND017004.severity = error", configText);
            return;
        }

        throw new FileNotFoundException("Unable to locate checked-in ArchLucid.Core source tree");
    }

    [Fact]
    public void Api_target_reuses_existing_analyzers_and_keeps_snapshot_rules_advisory()
    {
        DirectoryInfo? directory = new(Directory.GetCurrentDirectory());
        for (; directory is not null; directory = directory.Parent)
        {
            string apiProject = Path.Combine(directory.FullName, "ArchLucid.Api", "ArchLucid.Api.csproj");
            if (!File.Exists(apiProject))
                continue;

            string projectText = File.ReadAllText(apiProject);
            Assert.Contains("ArchLucid.Analyzers.csproj", projectText);
            Assert.Contains("OutputItemType=\"Analyzer\"", projectText);
            Assert.Contains("ReferenceOutputAssembly=\"false\"", projectText);

            string endpointPath = Path.Combine(directory.FullName, "ArchLucid.Api",
                "Controllers", "Planning", "GraphController.Snapshot.cs");
            Assert.True(File.Exists(endpointPath),
                "the FND017002-005 analyzers are scoped to a real temporal-snapshot endpoint");
            Assert.Contains("GetArchitectureGraphTemporalSnapshot(",
                File.ReadAllText(endpointPath));

            // Four existing checks analyze the API endpoint but have not yet
            // earned mandatory compiler enforcement. Preserve their current
            // diagnostic contract while collecting real-source baselines.
            (DiagnosticAnalyzer Analyzer, string Id)[] advisoryRules =
            [
                (new SecureNowSnapshotAuthorizationOrderAnalyzer(), "FND017002"),
                (new AuthorizationDecisionConsumptionAnalyzer(), "FND017003"),
                (new SnapshotAuthorizationDominanceAnalyzer(), "FND017004"),
                (new SnapshotAuthorizationResourceBindingAnalyzer(), "FND017005"),
            ];
            foreach ((DiagnosticAnalyzer analyzer, string expectedId) in advisoryRules)
            {
                DiagnosticDescriptor rule = Assert.Single(analyzer.SupportedDiagnostics);
                Assert.Equal(expectedId, rule.Id);
                Assert.Equal(DiagnosticSeverity.Info, rule.DefaultSeverity);
                Assert.True(rule.IsEnabledByDefault);
            }

            return;
        }

        throw new FileNotFoundException("Unable to locate checked-in ArchLucid.Api source tree");
    }

    [Fact]
    public async Task Core_can_use_independent_assembly()
    {
        var diagnostics = await AnalyzeAsync("ArchLucid.Core",
            "using Forbidden; public class X { public SecretService Service = new(); }",
            "ArchLucid.Contracts");
        Assert.Empty(diagnostics);
    }
}
