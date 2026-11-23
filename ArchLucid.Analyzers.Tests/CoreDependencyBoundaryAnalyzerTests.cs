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

    [Fact]
    public async Task Core_can_use_independent_assembly()
    {
        var diagnostics = await AnalyzeAsync("ArchLucid.Core",
            "using Forbidden; public class X { public SecretService Service = new(); }",
            "ArchLucid.Contracts");
        Assert.Empty(diagnostics);
    }
}
