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
  public async Task Reports_ClaimsPrincipal_primary_constructor_parameter_in_inner_layer_assembly()
  {
    const string testCode = """

namespace N
{
    using System.Security.Claims;

    public sealed class Handler({|#0:ClaimsPrincipal|} user);
}
""";

    DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithLocation(0)
        .WithArguments("System.Security.Claims.ClaimsPrincipal");

    await RunInnerLayerTestAsync(testCode, expected);
  }

  [Fact]
  public async Task Reports_global_qualified_ClaimsPrincipal_parameter_in_inner_layer_assembly()
  {
    const string testCode = """

namespace N
{
    public sealed class Handler
    {
        void M({|#0:global::System.Security.Claims.ClaimsPrincipal|} user) { }
    }
}
""";

    DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithSpan(6, 47, 6, 62)
        .WithArguments("System.Security.Claims.ClaimsPrincipal");

    await RunInnerLayerTestAsync(testCode, expected);
  }

  [Fact]
  public async Task Reports_ClaimsPrincipal_parameter_when_type_is_file_scoped_using_alias()
  {
    const string testCode = """

namespace N
{
    using Principal = System.Security.Claims.ClaimsPrincipal;

    public sealed class Handler
    {
        void M({|#0:Principal|} user) { }
    }
}
""";

    DiagnosticResult expectedAliasTarget = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithSpan(4, 46, 4, 61)
        .WithArguments("System.Security.Claims.ClaimsPrincipal");

    DiagnosticResult expectedParameter = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithSpan(8, 16, 8, 25)
        .WithArguments("System.Security.Claims.ClaimsPrincipal");

    await RunInnerLayerTestAsync(testCode, expectedAliasTarget, expectedParameter);
  }

  [Fact]
  public async Task Reports_ClaimsPrincipal_parameter_when_type_is_global_using_alias()
  {
    const string testCode = """
global using Principal = System.Security.Claims.ClaimsPrincipal;

namespace N
{
    public sealed class Handler
    {
        void M({|#0:Principal|} user) { }
    }
}
""";

    DiagnosticResult expectedAliasTarget = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithSpan(1, 49, 1, 64)
        .WithArguments("System.Security.Claims.ClaimsPrincipal");

    DiagnosticResult expectedParameter = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithSpan(7, 16, 7, 25)
        .WithArguments("System.Security.Claims.ClaimsPrincipal");

    await new CSharpAnalyzerTest<TenantIdentityBoundaryAnalyzer, DefaultVerifier>
    {
      TestCode = testCode,
      ExpectedDiagnostics = { expectedAliasTarget, expectedParameter },
      ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
      SolutionTransforms = { InnerLayerAssemblyNameTransform }
    }.RunAsync();
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
  public async Task Does_not_report_typeof_HttpContext()
  {
    const string testCode = """

namespace N
{
    using Microsoft.AspNetCore.Http;

    public sealed class C
    {
        System.Type M() => typeof(HttpContext);
    }
}
""";

    await RunInnerLayerTestAsync(testCode);
  }

  [Fact]
  public async Task Does_not_report_typeof_ClaimsPrincipal()
  {
    const string testCode = """

namespace N
{
    using System.Security.Claims;

    public sealed class C
    {
        System.Type M() => typeof(ClaimsPrincipal);
    }
}
""";

    await RunInnerLayerTestAsync(testCode);
  }

  [Fact]
  public async Task Does_not_report_when_assembly_is_tests()
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

    await RunTestAsync(testCode, TestsAssemblyNameTransform);
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
  public async Task Reports_single_diagnostic_when_generic_has_multiple_banned_type_arguments()
  {
    const string testCode = """

namespace N
{
    using System.Collections.Generic;
    using Microsoft.AspNetCore.Http;
    using System.Security.Claims;

    public sealed class C
    {
        void M({|#0:Dictionary|}<IHttpContextAccessor, ClaimsPrincipal> items) { }
    }
}
""";

    DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithLocation(0)
        .WithArguments("System.Collections.Generic.Dictionary<Microsoft.AspNetCore.Http.IHttpContextAccessor, System.Security.Claims.ClaimsPrincipal>");

    await RunInnerLayerTestAsync(testCode, expected);
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

  [Fact]
  public async Task Reports_nested_generic_type_argument_in_inner_layer_assembly()
  {
    const string testCode = """

namespace N
{
    using System.Collections.Generic;
    using Microsoft.AspNetCore.Http;

    public sealed class C
    {
        void M({|#0:Dictionary|}<string, List<IHttpContextAccessor>> items) { }
    }
}
""";

    DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithLocation(0)
        .WithArguments("System.Collections.Generic.Dictionary<string, System.Collections.Generic.List<Microsoft.AspNetCore.Http.IHttpContextAccessor>>");

    await RunInnerLayerTestAsync(testCode, expected);
  }

  [Fact]
  public async Task Reports_array_element_identifier_for_banned_type_in_inner_layer_assembly()
  {
    const string testCode = """

namespace N
{
    using Microsoft.AspNetCore.Http;

    public sealed class C
    {
        void M({|#0:IHttpContextAccessor|}[] accessors) { }
    }
}
""";

    DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithLocation(0)
        .WithArguments("Microsoft.AspNetCore.Http.IHttpContextAccessor");

    await RunInnerLayerTestAsync(testCode, expected);
  }

  [Fact]
  public async Task Reports_value_tuple_element_with_banned_type_in_inner_layer_assembly()
  {
    const string testCode = """

namespace N
{
    using Microsoft.AspNetCore.Http;

    public sealed class C
    {
        void M(({|#0:HttpContext|} ctx, int id) pair) { }
    }
}
""";

    DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithLocation(0)
        .WithArguments("Microsoft.AspNetCore.Http.HttpContext");

    await RunInnerLayerTestAsync(testCode, expected);
  }

  [Fact]
  public async Task Reports_delegate_type_argument_with_banned_type_in_inner_layer_assembly()
  {
    const string testCode = """

namespace N
{
    using System;
    using Microsoft.AspNetCore.Http;

    public sealed class C
    {
        void M({|#0:Action|}<HttpContext> callback) { }
    }
}
""";

    DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithLocation(0)
        .WithArguments("System.Action<Microsoft.AspNetCore.Http.HttpContext>");

    await RunInnerLayerTestAsync(testCode, expected);
  }

  [Fact]
  public async Task Reports_banned_type_in_method_return_type_in_inner_layer_assembly()
  {
    const string testCode = """

namespace N
{
    using Microsoft.AspNetCore.Http;

    public sealed class C
    {
        public {|#0:HttpContext|} Build() => throw null!;
    }
}
""";

    DiagnosticResult expected = CSharpAnalyzerVerifier<TenantIdentityBoundaryAnalyzer, DefaultVerifier>.Diagnostic(Arch001Descriptor.Rule)
        .WithLocation(0)
        .WithArguments("Microsoft.AspNetCore.Http.HttpContext");

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

  private static Solution TestsAssemblyNameTransform(Solution solution, ProjectId projectId) =>
      solution.WithProjectAssemblyName(projectId, "ArchLucid.Application.Tests");
}
