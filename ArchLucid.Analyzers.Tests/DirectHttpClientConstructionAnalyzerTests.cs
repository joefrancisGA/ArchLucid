using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;

public sealed class DirectHttpClientConstructionAnalyzerTests
{
    [Fact]
    public async Task Reports_new_HttpClient_in_product_assembly()
    {
        const string testCode = """
namespace N;

public sealed class C
{
    void M()
    {
        var _ = new System.Net.Http.HttpClient();
    }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<DirectHttpClientConstructionAnalyzer, DefaultVerifier>.Diagnostic(Arch004Descriptor.Rule)
            .WithSpan(7, 17, 7, 49);

        CSharpAnalyzerTest<DirectHttpClientConstructionAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { InnerLayerAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Does_not_flag_IHttpClientFactory_CreateClient()
    {
        // Mirrors Microsoft.Extensions.Http.IHttpClientFactory without referencing the extension
        // assembly (avoids reference-assembly version mismatch with the test host’s .NET 10 packs).
        const string testCode = """
namespace N;

internal interface IHttpClientFactory
{
    System.Net.Http.HttpClient CreateClient(string name);
}

public sealed class C
{
    void M(IHttpClientFactory f)
    {
        var _ = f.CreateClient("x");
    }
}
""";

        CSharpAnalyzerTest<DirectHttpClientConstructionAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { InnerLayerAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    private static Solution InnerLayerAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Application");
}
