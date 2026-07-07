using System.Collections.Immutable;

using Microsoft.AspNetCore.Http;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;
[Trait("Category", "Unit")]

public sealed class TenantIdentityBoundaryAnalyzerTests
{
    private static readonly ImmutableArray<MetadataReference> AspCoreHttpRefs =
    [
        MetadataReference.CreateFromFile(typeof(IHttpContextAccessor).Assembly.Location)
    ];

    [Fact]
    public async Task Reports_IHttpContextAccessor_in_inner_layer_assembly()
    {
        const string testCode = """
using Microsoft.AspNetCore.Http;

namespace N;

public sealed class C
{
    void M(IHttpContextAccessor a) { }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
            .WithSpan(7, 12, 7, 32)
            .WithArguments("Microsoft.AspNetCore.Http.IHttpContextAccessor");

        CSharpAnalyzerTest<TenantIdentityBoundaryAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Default,
            SolutionTransforms =
            {
                InnerLayerAssemblyNameTransform,
                AddAspNetCoreHttpReferences
            }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_when_assembly_is_api_boundary()
    {
        const string testCode = """
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
            ReferenceAssemblies = ReferenceAssemblies.Default,
            SolutionTransforms =
            {
                ApiAssemblyNameTransform,
                AddAspNetCoreHttpReferences
            }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Reports_ClaimsPrincipal_in_inner_layer_assembly()
    {
        const string testCode = """
using System.Security.Claims;

namespace N;

public sealed class C
{
    void M(ClaimsPrincipal? u) { }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
            .WithSpan(7, 12, 7, 27)
            .WithArguments("System.Security.Claims.ClaimsPrincipal");

        CSharpAnalyzerTest<TenantIdentityBoundaryAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Default,
            SolutionTransforms = { InnerLayerAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Reports_ClaimsPrincipal_field_in_inner_layer_assembly()
    {
        const string testCode = """
using System.Security.Claims;

namespace N;

public sealed class C
{
    ClaimsPrincipal _user;
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
            .WithSpan(7, 21, 7, 26)
            .WithArguments("System.Security.Claims.ClaimsPrincipal");

        CSharpAnalyzerTest<TenantIdentityBoundaryAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Default,
            SolutionTransforms = { InnerLayerAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Reports_HttpContext_local_in_inner_layer_assembly()
    {
        const string testCode = """
using Microsoft.AspNetCore.Http;

namespace N;

public sealed class C
{
    void M()
    {
        HttpContext ctx;
    }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
            .WithSpan(9, 9, 9, 20)
            .WithArguments("Microsoft.AspNetCore.Http.HttpContext");

        CSharpAnalyzerTest<TenantIdentityBoundaryAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Default,
            SolutionTransforms =
            {
                InnerLayerAssemblyNameTransform,
                AddAspNetCoreHttpReferences
            }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_nameof_banned_type()
    {
        const string testCode = """
using System.Security.Claims;

namespace N;

public sealed class C
{
    string M() => nameof(ClaimsPrincipal);
}
""";

        CSharpAnalyzerTest<TenantIdentityBoundaryAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Default,
            SolutionTransforms = { InnerLayerAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_when_assembly_is_host_boundary()
    {
        const string testCode = """
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
            ReferenceAssemblies = ReferenceAssemblies.Default,
            SolutionTransforms =
            {
                HostAssemblyNameTransform,
                AddAspNetCoreHttpReferences
            }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Reports_generic_type_argument_in_inner_layer_assembly()
    {
        const string testCode = """
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace N;

public sealed class C
{
    void M(List<IHttpContextAccessor> items) { }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
            .WithSpan(8, 17, 8, 37)
            .WithArguments("System.Collections.Generic.List<Microsoft.AspNetCore.Http.IHttpContextAccessor>");

        CSharpAnalyzerTest<TenantIdentityBoundaryAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Default,
            SolutionTransforms =
            {
                InnerLayerAssemblyNameTransform,
                AddAspNetCoreHttpReferences
            }
        };

        await test.RunAsync();
    }

    private static Solution InnerLayerAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Application");

    private static Solution ApiAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Api");

    private static Solution HostAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Host.Core");

    private static Solution AddAspNetCoreHttpReferences(Solution solution, ProjectId projectId) =>
        solution.AddMetadataReferences(projectId, AspCoreHttpRefs);
}
