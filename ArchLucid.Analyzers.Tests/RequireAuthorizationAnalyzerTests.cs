using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;

public sealed class RequireAuthorizationAnalyzerTests
{
    /// <summary>
    /// Minimal ASP.NET Core surface so the synthetic compilation matches <see cref="RequireAuthorizationAnalyzer"/> metadata names
    /// without pulling host MVC 10 reference assemblies into a Net90 reference set (CS1705).
    /// </summary>
    private const string AspNetCoreStubs = """
namespace Microsoft.AspNetCore.Mvc
{
    public interface IActionResult { }

    public abstract class ControllerBase
    {
        protected IActionResult Ok() => throw null!;
    }

    public sealed class HttpGetAttribute : System.Attribute
    {
    }
}

namespace Microsoft.AspNetCore.Authorization
{
    public class AuthorizeAttribute : System.Attribute
    {
    }

    public class AllowAnonymousAttribute : System.Attribute
    {
    }
}

""";

    [Fact]
    public async Task Reports_public_action_without_authorization_when_controller_has_none()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Mvc;

    public sealed class BadController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get() => Ok();
    }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(33, 30, 33, 33)
            .WithArguments("BadController.Get()");

        CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_when_controller_has_Authorize()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    [Authorize]
    public sealed class GoodController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get() => Ok();
    }
}
""";

        CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_when_base_type_has_Authorize()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    [Authorize]
    public abstract class ApiControllerBase : ControllerBase
    {
    }

    public sealed class DerivedController : ApiControllerBase
    {
        [HttpGet]
        public IActionResult Get() => Ok();
    }
}
""";

        CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Reports_only_action_missing_authorization_when_another_action_is_Authorized()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public sealed class MixedController : ControllerBase
    {
        [HttpGet]
        [Authorize]
        public IActionResult A() => Ok();

        [HttpGet]
        public IActionResult B() => Ok();
    }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(38, 30, 38, 31)
            .WithArguments("MixedController.B()");

        CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Reports_controller_when_there_are_no_public_actions()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Mvc;

    public sealed class EmptyController : ControllerBase
    {
    }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(30, 25, 30, 40)
            .WithArguments("EmptyController");

        CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    private static Solution ProductAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Api");
}
