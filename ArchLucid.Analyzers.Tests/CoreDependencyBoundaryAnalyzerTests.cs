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
                "namespace Forbidden { public class SecretService {} }") },
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
    public async Task Core_can_use_independent_assembly()
    {
        var diagnostics = await AnalyzeAsync("ArchLucid.Core",
            "using Forbidden; public class X { public SecretService Service = new(); }",
            "ArchLucid.Contracts");
        Assert.Empty(diagnostics);
    }
}
