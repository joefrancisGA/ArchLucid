using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;
using Microsoft.CodeAnalysis.Text;

namespace ArchLucid.Analyzers.Tests;
[Trait("Category", "Unit")]

public sealed class TenantIdentityBoundaryAnalyzerTests
{
  private const string AspNetCoreHttpStubs = """

namespace Microsoft.AspNetCore.Http
{
    public sealed class HttpContext
    {
    }

    public interface IHttpContextAccessor
    {
        HttpContext? HttpContext { get; }
    }
}

""";

  [Fact]
  public async Task Reports_IHttpContextAccessor_in_inner_layer_assembly()
  {
    const string testCode = """

namespace N
{
    using Microsoft.AspNetCore.Http;

    public sealed class C
    {
        void M({|#0:IHttpContextAccessor|} a) { }
    }
}
""";

    DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithLocation(0)
        .WithArguments("Microsoft.AspNetCore.Http.IHttpContextAccessor");

    await RunInnerLayerTestAsync(testCode, expected);
  }

  [Fact]
  public async Task Does_not_report_when_assembly_is_api_boundary()
  {
    const string testCode = """

namespace N
{
    using Microsoft.AspNetCore.Http;

    public sealed class C
    {
        void M(IHttpContextAccessor a) { }
    }
}
""";

    await RunTestAsync(testCode, ApiAssemblyNameTransform);
  }

  [Fact]
  public async Task Reports_ClaimsPrincipal_in_inner_layer_assembly()
  {
    const string testCode = """

namespace N
{
    using System.Security.Claims;

    public sealed class C
    {
        void M({|#0:ClaimsPrincipal|}? u) { }
    }
}
""";

    DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithLocation(0)
        .WithArguments("System.Security.Claims.ClaimsPrincipal");

    await RunInnerLayerTestAsync(testCode, expected);
  }

  [Fact]
  public async Task Reports_ClaimsPrincipal_field_in_inner_layer_assembly()
  {
    const string testCode = """

namespace N
{
    using System.Security.Claims;

    public sealed class C
    {
        {|#0:ClaimsPrincipal|} _user;
    }
}
""";

    DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithLocation(0)
        .WithArguments("System.Security.Claims.ClaimsPrincipal");

    await RunInnerLayerTestAsync(testCode, expected);
  }

  [Fact]
  public async Task Reports_HttpContext_local_in_inner_layer_assembly()
  {
    const string testCode = """

namespace N
{
    using Microsoft.AspNetCore.Http;

    public sealed class C
    {
        void M()
        {
            {|#0:HttpContext|} ctx;
        }
    }
}
""";

    DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithLocation(0)
        .WithArguments("Microsoft.AspNetCore.Http.HttpContext");

    await RunInnerLayerTestAsync(testCode, expected);
  }

  [Fact]
  public async Task Does_not_report_nameof_banned_type()
  {
    const string testCode = """

namespace N
{
    using System.Security.Claims;

    public sealed class C
    {
        string M() => nameof(ClaimsPrincipal);
    }
}
""";

    await RunInnerLayerTestAsync(testCode);
  }

  [Fact]
  public async Task Does_not_report_when_assembly_is_host_boundary()
  {
    const string testCode = """

namespace N
{
    using Microsoft.AspNetCore.Http;

    public sealed class C
    {
        void M(IHttpContextAccessor a) { }
    }
}
""";

    await RunTestAsync(testCode, HostAssemblyNameTransform);
  }

  [Fact]
  public async Task Reports_generic_type_argument_in_inner_layer_assembly()
  {
    const string testCode = """

namespace N
{
    using System.Collections.Generic;
    using Microsoft.AspNetCore.Http;

    public sealed class C
    {
        void M({|#0:List|}<IHttpContextAccessor> items) { }
    }
}
""";

    DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithLocation(0)
        .WithArguments("System.Collections.Generic.List<Microsoft.AspNetCore.Http.IHttpContextAccessor>");

    await RunInnerLayerTestAsync(testCode, expected);
  }

  private static Task RunInnerLayerTestAsync(string testCode, params DiagnosticResult[] expectedDiagnostics) =>
      RunTestAsync(testCode, InnerLayerAssemblyNameTransform, expectedDiagnostics);

  private static async Task RunTestAsync(
      string testCode,
      Func<Solution, ProjectId, Solution> assemblyNameTransform,
      params DiagnosticResult[] expectedDiagnostics)
  {
    CSharpAnalyzerTest<TenantIdentityBoundaryAnalyzer, DefaultVerifier> test = new()
    {
      TestCode = testCode,
      ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
      SolutionTransforms =
            {
                AddAspNetCoreHttpStubProject,
                EnsureLibraryOutput,
                assemblyNameTransform
            }
    };

    test.ExpectedDiagnostics.AddRange(expectedDiagnostics);

    await test.RunAsync();
  }

  private static Solution EnsureLibraryOutput(Solution solution, ProjectId projectId)
  {
    Project? project = solution.GetProject(projectId);

    if (project is null)
      return solution;

    return solution.WithProjectCompilationOptions(
        projectId,
        project.CompilationOptions!.WithOutputKind(OutputKind.DynamicallyLinkedLibrary));
  }

  private static Solution AddAspNetCoreHttpStubProject(Solution solution, ProjectId testProjectId)
  {
    ProjectId apiProjectId = ProjectId.CreateNewId(debugName: "ArchLucid.Api.HttpStubs");
    solution = solution.AddProject(apiProjectId, "ArchLucid.Api", "ArchLucid.Api", LanguageNames.CSharp);

    Project? testProject = solution.GetProject(testProjectId);

    if (testProject is not null)
    {
      foreach (MetadataReference reference in testProject.MetadataReferences)
        solution = solution.AddMetadataReference(apiProjectId, reference);
    }

    DocumentId stubDocumentId = DocumentId.CreateNewId(apiProjectId, debugName: "HttpStubs.cs");
    solution = solution.AddDocument(stubDocumentId, "HttpStubs.cs", SourceText.From(AspNetCoreHttpStubs));
    solution = solution.AddProjectReference(testProjectId, new ProjectReference(apiProjectId));
    solution = EnsureLibraryOutput(solution, apiProjectId);

    return solution;
  }

  private static Solution InnerLayerAssemblyNameTransform(Solution solution, ProjectId projectId) =>
      solution.WithProjectAssemblyName(projectId, "ArchLucid.Application");

  private static Solution ApiAssemblyNameTransform(Solution solution, ProjectId projectId) =>
      solution.WithProjectAssemblyName(projectId, "ArchLucid.Api");

  private static Solution HostAssemblyNameTransform(Solution solution, ProjectId projectId) =>
      solution.WithProjectAssemblyName(projectId, "ArchLucid.Host.Core");
}
