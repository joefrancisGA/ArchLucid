using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Diagnostics;
using Microsoft.CodeAnalysis.Emit;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;
[Trait("Category", "Unit")]

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

    public sealed class HttpPostAttribute : System.Attribute
    {
        public HttpPostAttribute(string? template = null) { }
    }

    public sealed class NonActionAttribute : System.Attribute
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
            .WithSpan(42, 30, 42, 33)
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
    public async Task Reports_inherited_unauthorized_action_when_derived_declares_only_public_NonAction_helper()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Mvc;

    public abstract class SharedUnauthenticatedGetController : ControllerBase
    {
        [HttpGet]
        public IActionResult InheritedGet() => Ok();
    }

    public sealed class DerivedWithNonActionHelperOnlyController : SharedUnauthenticatedGetController
    {
        [NonAction]
        public IActionResult Helper() => Ok();
    }
}
""";

        DiagnosticResult expectedOnBase = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(42, 30, 42, 42)
            .WithArguments("SharedUnauthenticatedGetController.InheritedGet()");

        DiagnosticResult expectedOnDerived = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(45, 25, 45, 65)
            .WithArguments("SharedUnauthenticatedGetController.InheritedGet()");

        CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedOnBase, expectedOnDerived },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_inherited_unauthorized_action_when_derived_declares_authorized_action()
    {
        MetadataReference sharedControllerReference = BuildSharedUnauthenticatedGetControllerReference();
        CSharpCompilation apiCompilation = CSharpCompilation.Create(
            "ArchLucid.Api",
            [
                CSharpSyntaxTree.ParseText(
                    AspNetCoreStubs +
                    """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public sealed class DerivedWithAuthorizedPostController : Shared.Controllers.SharedUnauthenticatedGetController
    {
        [Authorize]
        [HttpPost]
        public IActionResult Post() => Ok();
    }
}
""")
            ],
            TrustedPlatformReferences().Append(sharedControllerReference),
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        ImmutableArray<Diagnostic> diagnostics =
            await apiCompilation
                .WithAnalyzers(ImmutableArray.Create<DiagnosticAnalyzer>(new RequireAuthorizationAnalyzer()))
                .GetAnalyzerDiagnosticsAsync();

        Assert.DoesNotContain(
            diagnostics,
            diagnostic => diagnostic.Id == Al0001Descriptor.Rule.Id);
    }

    [Fact]
    public async Task Does_not_report_derived_controller_when_only_inherited_action_is_allow_anonymous()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public abstract class SharedController : ControllerBase
    {
        [AllowAnonymous]
        public IActionResult Get() => Ok();
    }

    public sealed class DerivedController : SharedController
    {
    }
}
""";

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
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
            .WithSpan(47, 30, 47, 31)
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
    public async Task Does_not_report_public_NonAction_helper()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    [Authorize]
    public sealed class HelperController : ControllerBase
    {
        [NonAction]
        public IActionResult Helper() => Ok();
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
    public async Task Does_not_report_when_interface_method_has_Authorize()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public interface IAuthorizedApi
    {
        [Authorize]
        IActionResult Get();
    }

    public sealed class ImplController : ControllerBase, IAuthorizedApi
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
    public async Task Does_not_report_when_implemented_interface_has_Authorize()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    [Authorize]
    public interface IAuthorizedApi
    {
        IActionResult Get();
    }

    public sealed class ImplController : ControllerBase, IAuthorizedApi
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
            .WithSpan(39, 25, 39, 40)
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

    [Fact]
    public async Task Does_not_report_controller_when_all_public_actions_have_AllowAnonymous()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public sealed class PublicController : ControllerBase
    {
        [HttpGet]
        [AllowAnonymous]
        public IActionResult A() => Ok();

        [HttpGet]
        [AllowAnonymous]
        public IActionResult B() => Ok();
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
    public async Task Does_not_report_NonAction_helper_inherited_from_base_method()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Mvc;

    public abstract class HelperBaseController : ControllerBase
    {
        [NonAction]
        public virtual IActionResult Helper() => Ok();
    }

    public sealed class DerivedHelperController : HelperBaseController
    {
        public override IActionResult Helper() => Ok();
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
    public async Task Does_not_report_AllowAnonymous_helper_inherited_from_base_method()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public abstract class AnonymousHelperBaseController : ControllerBase
    {
        [AllowAnonymous]
        public virtual IActionResult Helper() => Ok();
    }

    public sealed class DerivedAnonymousHelperController : AnonymousHelperBaseController
    {
        public override IActionResult Helper() => Ok();
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
    public async Task Does_not_report_Authorize_helper_inherited_from_base_method()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public abstract class AuthorizedHelperBaseController : ControllerBase
    {
        [Authorize]
        public virtual IActionResult Helper() => Ok();
    }

    public sealed class DerivedAuthorizedHelperController : AuthorizedHelperBaseController
    {
        public override IActionResult Helper() => Ok();
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
    public async Task Does_not_report_when_default_interface_implementation_carries_Authorize()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public interface IAuthorizedDefaultApi
    {
        [Authorize]
        [HttpPost]
        Task<IActionResult> SubmitAsync()
        {
            throw new System.NotImplementedException();
        }
    }

    public sealed class DefaultImplController : ControllerBase, IAuthorizedDefaultApi
    {
        [HttpPost("submit")]
        public Task<IActionResult> SubmitAsync() => Task.FromResult<IActionResult>(Ok());
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
    public async Task Reports_nested_controller_class_without_authorization()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Mvc;

    public sealed class OuterController : ControllerBase
    {
        public sealed class NestedController : ControllerBase
        {
            [HttpGet]
            public IActionResult {|#0:Get|}() => Ok();
        }
    }
}
""";

        DiagnosticResult expectedNested = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithLocation(0)
            .WithArguments("OuterController.NestedController.Get()");

        DiagnosticResult expectedOuter = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(39, 25, 39, 40)
            .WithArguments("OuterController");

        CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedOuter, expectedNested },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Reports_public_action_without_authorization_in_test_host_named_assembly()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Mvc;

    public sealed class TestHostController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get() => Ok();
    }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(42, 30, 42, 33)
            .WithArguments("TestHostController.Get()");

        CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms =
            {
                (solution, projectId) => solution.WithProjectAssemblyName(projectId, "ArchLucid.Api.TestHost"),
            },
        };

        await test.RunAsync();
    }

    private static Solution ProductAssemblyNameTransform(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Api");

    private static MetadataReference BuildSharedUnauthenticatedGetControllerReference()
    {
        CSharpCompilation compilation = CSharpCompilation.Create(
            "Shared.Controllers",
            [
                CSharpSyntaxTree.ParseText(
                    AspNetCoreStubs +
                    """

namespace Shared.Controllers
{
    using Microsoft.AspNetCore.Mvc;

    public abstract class SharedUnauthenticatedGetController : ControllerBase
    {
        [HttpGet]
        public IActionResult InheritedGet() => Ok();
    }
}
""")
            ],
            TrustedPlatformReferences(),
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        using MemoryStream image = new();
        EmitResult emit = compilation.Emit(image);
        Assert.True(emit.Success, string.Join(Environment.NewLine, emit.Diagnostics));

        return MetadataReference.CreateFromImage(image.ToArray());
    }

    private static IEnumerable<MetadataReference> TrustedPlatformReferences() =>
        ((string?)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES") ?? string.Empty)
            .Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries)
            .Select(path => MetadataReference.CreateFromFile(path));
}
