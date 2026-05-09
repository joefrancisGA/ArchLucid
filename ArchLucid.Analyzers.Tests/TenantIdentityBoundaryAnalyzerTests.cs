using ArchLucid.Analyzers;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;

public sealed class TenantIdentityBoundaryAnalyzerTests
{
    [Fact]
    public async Task Reports_IHttpContextAccessor_in_inner_layer_assembly()
    {
        string testCode = """
using Microsoft.AspNetCore.Http;

namespace N;

public sealed class C
{
    void M([|IHttpContextAccessor|] a) { }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
            .WithLocation(0)
            .WithArguments("Microsoft.AspNetCore.Http.IHttpContextAccessor");

        CSharpAnalyzerTest<TenantIdentityBoundaryAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            SolutionTransforms = { InnerLayerAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_when_assembly_is_api_boundary()
    {
        string testCode = """
using Microsoft.AspNetCore.Http;

namespace N;

public sealed class C
{
    void M(IHttpContextAccessor a) { }
}
""";

        CSharpAnalyzerTest<TenantIdentityBoundaryAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            SolutionTransforms = { ApiAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Reports_ClaimsPrincipal_in_inner_layer_assembly()
    {
        string testCode = """
using System.Security.Claims;

namespace N;

public sealed class C
{
    void M([|ClaimsPrincipal|]? u) { }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
            .WithLocation(0)
            .WithArguments("System.Security.Claims.ClaimsPrincipal");

        CSharpAnalyzerTest<TenantIdentityBoundaryAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            SolutionTransforms = { InnerLayerAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    private static Solution InnerLayerAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Application");

    private static Solution ApiAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Api");
}
