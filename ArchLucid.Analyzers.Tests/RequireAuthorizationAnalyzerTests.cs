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
    public async Task Reports_type_level_AL0001_for_standalone_abstract_controller_with_unauthorized_action()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Mvc;

    public abstract class StandaloneAbstractController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get() => Ok();
    }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(39, 27, 39, 55)
            .WithArguments("StandaloneAbstractController");

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
    public async Task Does_not_treat_unrelated_ControllerBase_type_in_another_namespace_as_mvc_controller_base()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace Evil
{
    public class ControllerBase
    {
    }

    public sealed class EvilController : ControllerBase
    {
        public void Mutate() { }
    }
}

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public sealed class GoodController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get() => Ok();
    }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(55, 30, 55, 33)
            .WithArguments("GoodController.Get()");

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

        DiagnosticResult expectedOnAbstract = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(39, 27, 39, 61)
            .WithArguments("SharedUnauthenticatedGetController");

        DiagnosticResult expectedOnDerived = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(45, 25, 45, 65)
            .WithArguments("SharedUnauthenticatedGetController.InheritedGet()");

        CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier> test = new()
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedOnAbstract, expectedOnDerived },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        };

        await test.RunAsync();
    }

    [Fact]
    public async Task Reports_inherited_unauthorized_action_when_unauthenticated_base_lives_in_referenced_assembly()
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
    using Microsoft.AspNetCore.Mvc;

    public sealed class DerivedFromReferencedUnauthenticatedBaseController
        : Shared.Controllers.SharedUnauthenticatedGetController
    {
        [NonAction]
        public IActionResult Helper() => Ok();
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

        Assert.Single(
            diagnostics,
            diagnostic => diagnostic.Id == Al0001Descriptor.Rule.Id &&
                          diagnostic.GetMessage().Contains("InheritedGet", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Reports_inherited_unauthorized_action_when_derived_declares_unrelated_authorized_action()
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

        Assert.Single(
            diagnostics,
            diagnostic => diagnostic.Id == Al0001Descriptor.Rule.Id &&
                          diagnostic.GetMessage().Contains("InheritedGet", StringComparison.Ordinal));
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
    public async Task Does_not_report_abstract_controller_when_only_inherited_action_is_allow_anonymous()
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

    public abstract class MiddleController : SharedController
    {
    }

    public sealed class DerivedController : MiddleController
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
    public async Task Does_not_report_grandchild_controller_when_interface_type_has_AllowAnonymous()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    [AllowAnonymous]
    public interface IAnonymousApi
    {
        IActionResult Get();
    }

    public abstract class SharedController : ControllerBase, IAnonymousApi
    {
        [HttpGet]
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
    public async Task Does_not_report_explicit_interface_implementation_when_interface_method_has_Authorize()
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
        IActionResult IAuthorizedApi.Get() => Ok();
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
    public async Task Does_not_report_when_intermediate_controller_base_has_Authorize()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    [Authorize]
    public abstract class AuthorizedControllerBase : ControllerBase
    {
    }

    public sealed class ChildController : AuthorizedControllerBase
    {
        [HttpGet]
        public IActionResult Get() => Ok();
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
    public async Task Does_not_report_type_level_AL0001_when_only_non_public_route_marked_actions_exist()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Mvc;

    public sealed class ProtectedRouteController : ControllerBase
    {
        [HttpGet]
        protected IActionResult Get() => Ok();
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
    public async Task Does_not_report_type_level_AL0001_when_only_NonAction_route_marked_public_helpers_exist()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Mvc;

    public sealed class NonActionRouteHelperController : ControllerBase
    {
        [NonAction]
        [HttpGet]
        public IActionResult BuildTemplate() => Ok();
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
    public async Task Does_not_report_type_level_AL0001_when_only_private_route_marked_actions_exist()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Mvc;

    public sealed class PrivateRouteController : ControllerBase
    {
        [HttpPost]
        private IActionResult Post() => Ok();
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
    public async Task Reports_nested_controller_inside_static_outer_class_without_authorization()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Mvc;

    public static class StaticOuter
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
            .WithArguments("StaticOuter.NestedController.Get()");

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedNested },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Reports_inherited_unauthorized_base_post_on_concrete_leaf_of_abstract_with_only_authorized_declared_action()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public class UnsecuredPostBase : ControllerBase
    {
        [HttpPost]
        public IActionResult Post() => Ok();
    }

    public abstract class AuthorizedDeclaredMiddle : UnsecuredPostBase
    {
        [Authorize]
        [HttpGet]
        public IActionResult Safe() => Ok();
    }

    public sealed class {|#0:LeafController|} : AuthorizedDeclaredMiddle
    {
    }
}
""";

        DiagnosticResult expectedOnBasePost =
            CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                .WithSpan(43, 30, 43, 34)
                .WithArguments("UnsecuredPostBase.Post()");

        DiagnosticResult expectedOnLeaf =
            CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                .WithLocation(0)
                .WithArguments("UnsecuredPostBase.Post()");

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedOnBasePost, expectedOnLeaf },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Reports_type_level_AL0001_on_abstract_controller_with_unauthorized_explicit_interface_despite_authorized_base_action()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public abstract class SecureBase : ControllerBase
    {
        [Authorize]
        [HttpGet]
        public IActionResult Safe() => Ok();
    }

    public interface IUnsecuredApi
    {
        IActionResult Get();
    }

    public abstract class {|#0:MiddleController|} : SecureBase, IUnsecuredApi
    {
        [HttpGet]
        IActionResult IUnsecuredApi.Get() => Ok();
    }
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                .WithLocation(0)
                .WithArguments("MiddleController");

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            ExpectedDiagnostics = { expectedDiagnostic },
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Reports_outer_abstract_only_when_nested_controller_is_authorized_and_outer_has_unauthorized_explicit_interface()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public interface IUnsecuredApi
    {
        IActionResult Get();
    }

    public abstract class {|#0:OuterController|} : ControllerBase, IUnsecuredApi
    {
        [HttpGet]
        IActionResult IUnsecuredApi.Get() => Ok();

        public sealed class NestedController : ControllerBase
        {
            [Authorize]
            [HttpGet]
            public IActionResult Get() => Ok();
        }
    }
}
""";

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            ExpectedDiagnostics =
            {
                CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                    .WithLocation(0)
                    .WithArguments("OuterController")
            },
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_empty_derived_when_explicit_interface_implementation_declares_Authorize()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public interface IAuthorizedApi
    {
        IActionResult Get();
    }

    public abstract class SharedController : ControllerBase, IAuthorizedApi
    {
        [Authorize]
        [HttpGet]
        IActionResult IAuthorizedApi.Get() => Ok();
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
    public async Task Does_not_report_explicit_interface_implementation_when_impl_declares_AllowAnonymous()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public interface IAnonymousApi
    {
        IActionResult Get();
    }

    public sealed class ImplController : ControllerBase, IAnonymousApi
    {
        [AllowAnonymous]
        [HttpGet]
        IActionResult IAnonymousApi.Get() => Ok();
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
    public async Task Reports_empty_abstract_middle_inheriting_unauthorized_explicit_when_base_has_sibling_authorize_marker()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    [Authorize]
    public interface IAuthorizedMarker
    {
    }

    public interface IUnsecuredApi
    {
        IActionResult Post();
    }

    public abstract class {|#0:SharedBase|} : ControllerBase, IAuthorizedMarker, IUnsecuredApi
    {
        [HttpPost]
        IActionResult IUnsecuredApi.Post() => Ok();
    }

    public abstract class {|#1:EmptyMiddle|} : SharedBase
    {
    }
}
""";

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            ExpectedDiagnostics =
            {
                CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                    .WithLocation(0)
                    .WithArguments("SharedBase"),
                CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                    .WithLocation(1)
                    .WithArguments("EmptyMiddle"),
            },
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Reports_inherited_unauthorized_explicit_when_derived_declares_authorized_public_action()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public interface IUnsecuredApi
    {
        IActionResult Post();
    }

    public abstract class {|#0:SharedBase|} : ControllerBase, IUnsecuredApi
    {
        [HttpPost]
        IActionResult IUnsecuredApi.{|#1:Post|}() => Ok();
    }

    public sealed class {|#2:DerivedController|} : SharedBase
    {
        [Authorize]
        [HttpGet]
        public IActionResult Get() => Ok();
    }
}
""";

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            ExpectedDiagnostics =
            {
                CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                    .WithLocation(0)
                    .WithArguments("SharedBase"),
                CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                    .WithLocation(2)
                    .WithArguments("SharedBase.IUnsecuredApi.Post()"),
            },
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Reports_inherited_unauthorized_explicit_interface_when_base_also_implements_allow_anonymous_marker_interface()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    [AllowAnonymous]
    public interface IAnonymousMarker
    {
    }

    public interface IUnsecuredApi
    {
        IActionResult Post();
    }

    public abstract class {|#0:SharedBase|} : ControllerBase, IAnonymousMarker, IUnsecuredApi
    {
        [HttpPost]
        IActionResult IUnsecuredApi.{|#1:Post|}() => Ok();
    }

    public sealed class {|#2:DerivedController|} : SharedBase
    {
    }
}
""";

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            ExpectedDiagnostics =
            {
                CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                    .WithLocation(0)
                    .WithArguments("SharedBase"),
                CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                    .WithLocation(2)
                    .WithArguments("SharedBase.IUnsecuredApi.Post()"),
            },
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Reports_inherited_unauthorized_explicit_interface_when_base_also_implements_authorized_marker_interface()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    [Authorize]
    public interface IAuthorizedMarker
    {
    }

    public interface IUnsecuredApi
    {
        IActionResult Post();
    }

    public abstract class {|#0:SharedBase|} : ControllerBase, IAuthorizedMarker, IUnsecuredApi
    {
        [HttpPost]
        IActionResult IUnsecuredApi.{|#1:Post|}() => Ok();
    }

    public sealed class {|#2:DerivedController|} : SharedBase
    {
    }
}
""";

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            ExpectedDiagnostics =
            {
                CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                    .WithLocation(0)
                    .WithArguments("SharedBase"),
                CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                    .WithLocation(2)
                    .WithArguments("SharedBase.IUnsecuredApi.Post()"),
            },
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Reports_inherited_unauthorized_explicit_interface_action_for_empty_derived_controller()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Mvc;

    public interface IUnsecuredApi
    {
        IActionResult Get();
    }

    public abstract class {|#0:SharedController|} : ControllerBase, IUnsecuredApi
    {
        [HttpGet]
        IActionResult IUnsecuredApi.Get() => Ok();
    }

    public sealed class {|#1:DerivedController|} : SharedController
    {
    }
}
""";

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            ExpectedDiagnostics =
            {
                CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                    .WithLocation(0)
                    .WithArguments("SharedController"),
                CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                    .WithLocation(1)
                    .WithArguments("SharedController.IUnsecuredApi.Get()")
            },
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Reports_unauthorized_explicit_interface_action_when_controller_has_authorized_public_action()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public interface IUnsecuredApi
    {
        IActionResult Post();
    }

    public sealed class MixedController : ControllerBase, IUnsecuredApi
    {
        [Authorize]
        [HttpGet]
        public IActionResult Get() => Ok();

        [HttpPost]
        IActionResult IUnsecuredApi.{|#0:Post|}() => Ok();
    }
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                .WithLocation(0)
                .WithArguments("MixedController.IUnsecuredApi.Post()");

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            ExpectedDiagnostics = { expectedDiagnostic },
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Reports_unsecured_explicit_interface_when_implemented_interface_inherits_authorized_marker_interface()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    [Authorize]
    public interface IAuthorizedRoot
    {
    }

    public interface IUnsecuredApi : IAuthorizedRoot
    {
        IActionResult Post();
    }

    public sealed class InheritedMarkerController : ControllerBase, IUnsecuredApi
    {
        [HttpPost]
        IActionResult IUnsecuredApi.{|#0:Post|}() => Ok();
    }
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                .WithLocation(0)
                .WithArguments("InheritedMarkerController.IUnsecuredApi.Post()");

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            ExpectedDiagnostics = { expectedDiagnostic },
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Reports_inherited_unauthorized_action_when_derived_declares_only_undecorated_public_helper()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Mvc;

    public abstract class {|#2:SharedUnauthenticatedGetController|} : ControllerBase
    {
        [HttpGet]
        public IActionResult InheritedGet() => Ok();
    }

    public sealed class {|#1:DerivedWithUndecoratedHelperOnlyController|} : SharedUnauthenticatedGetController
    {
        public IActionResult {|#0:Helper|}() => Ok();
    }
}
""";

        DiagnosticResult expectedOnHelper =
            CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                .WithLocation(0)
                .WithArguments("DerivedWithUndecoratedHelperOnlyController.Helper()");

        DiagnosticResult expectedOnInherited =
            CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                .WithLocation(1)
                .WithArguments("SharedUnauthenticatedGetController.InheritedGet()");

        DiagnosticResult expectedOnAbstractBase =
            CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                .WithLocation(2)
                .WithArguments("SharedUnauthenticatedGetController");

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedOnHelper, expectedOnInherited, expectedOnAbstractBase },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Reports_unsecured_explicit_interface_when_sibling_interface_has_type_level_Authorize()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    [Authorize]
    public interface IAuthorizedMarker
    {
    }

    public interface IUnsecuredApi
    {
        IActionResult Post();
    }

    public sealed class DualInterfaceController : ControllerBase, IAuthorizedMarker, IUnsecuredApi
    {
        [HttpPost]
        IActionResult IUnsecuredApi.{|#0:Post|}() => Ok();
    }
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                .WithLocation(0)
                .WithArguments("DualInterfaceController.IUnsecuredApi.Post()");

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            ExpectedDiagnostics = { expectedDiagnostic },
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_derived_controller_when_inherited_action_is_allow_anonymous_on_interface()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public interface IAnonymousApi
    {
        [AllowAnonymous]
        IActionResult Get();
    }

    public abstract class SharedController : ControllerBase, IAnonymousApi
    {
        [HttpGet]
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
    public async Task Does_not_report_derived_controller_when_inherited_action_is_authorized_on_interface()
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

    public abstract class SharedController : ControllerBase, IAuthorizedApi
    {
        [HttpGet]
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
    public async Task Does_not_report_type_level_AL0001_on_outer_shell_when_only_nested_authorized_controller_exists()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public sealed class OuterShellController : ControllerBase
    {
        public sealed class NestedController : ControllerBase
        {
            [Authorize]
            [HttpGet]
            public IActionResult Get() => Ok();
        }
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

    [Fact]
    public async Task Reports_type_level_AL0001_when_empty_concrete_controller_inherits_unauthorized_default_interface_mutating_member()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Mvc;

    public interface IMutatingDefaultApi
    {
        [HttpPost("x")]
        System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
        {
            return System.Threading.Tasks.Task.FromResult<IActionResult>(null!);
        }
    }

    public sealed class {|#0:EmptyDefaultInterfaceController|} : ControllerBase, IMutatingDefaultApi
    {
    }
}
""";

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            ExpectedDiagnostics =
            {
                CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                    .WithLocation(0)
                    .WithArguments("EmptyDefaultInterfaceController"),
            },
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Reports_type_level_AL0001_on_abstract_controller_inheriting_unauthorized_default_interface_mutating_member()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Mvc;

    public interface IMutatingDefaultApi
    {
        [HttpPost("x")]
        System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
        {
            return System.Threading.Tasks.Task.FromResult<IActionResult>(null!);
        }
    }

    public abstract class {|#0:AbstractDefaultInterfaceController|} : ControllerBase, IMutatingDefaultApi
    {
    }
}
""";

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            ExpectedDiagnostics =
            {
                CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                    .WithLocation(0)
                    .WithArguments("AbstractDefaultInterfaceController"),
            },
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_empty_controller_when_default_interface_derived_member_is_allow_anonymous()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public interface IAuthorizedDefault
    {
        [Authorize]
        [HttpPost("x")]
        System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
        {
            return System.Threading.Tasks.Task.FromResult<IActionResult>(null!);
        }
    }

    public interface IAnonymousDerived : IAuthorizedDefault
    {
        [AllowAnonymous]
        [HttpPost("x")]
        new System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
        {
            return System.Threading.Tasks.Task.FromResult<IActionResult>(null!);
        }
    }

    public sealed class DerivedAnonymousDefaultController : ControllerBase, IAnonymousDerived
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
    public async Task Reports_AL0001_on_undecorated_HttpPost_when_sibling_action_has_AllowAnonymous()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public sealed class MixedAnonymousController : ControllerBase
    {
        [HttpPost]
        [AllowAnonymous]
        public IActionResult AnonymousPost() => Ok();

        [HttpPost]
        public IActionResult {|#0:UnsecuredPost|}() => Ok();
    }
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithLocation(0)
            .WithArguments("MixedAnonymousController.UnsecuredPost()");

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_AL0001_when_sibling_HttpPost_has_Authorize_and_other_has_AllowAnonymous()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    public sealed class MixedPolicyAndAnonymousController : ControllerBase
    {
        [HttpPost]
        [AllowAnonymous]
        public IActionResult AnonymousPost() => Ok();

        [HttpPost]
        [Authorize]
        public IActionResult PolicyPost() => Ok();
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
    public async Task Reports_inherited_unauthorized_action_when_derived_declares_NonAction_parameterless_constructor()
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

    public sealed class DerivedWithNonActionCtorController : SharedUnauthenticatedGetController
    {
        [NonAction]
        public DerivedWithNonActionCtorController()
        {
        }
    }
}
""";

        DiagnosticResult expectedOnAbstract = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(39, 27, 39, 61)
            .WithArguments("SharedUnauthenticatedGetController");

        DiagnosticResult expectedOnDerived = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(45, 25, 45, 59)
            .WithArguments("SharedUnauthenticatedGetController.InheritedGet()");

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedOnAbstract, expectedOnDerived },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_AL0001_for_undecorated_action_when_controller_has_type_level_Authorize_Roles()
    {
        string aspNetCoreStubsWithRoles = AspNetCoreStubs.Replace(
            """
    public class AuthorizeAttribute : System.Attribute
    {
    }
""",
            """
    public class AuthorizeAttribute : System.Attribute
    {
        public string? Roles { get; set; }
    }
""",
            StringComparison.Ordinal);

        const string testCode = """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    [Authorize(Roles = "Admin")]
    public sealed class RoleAuthorizedController : ControllerBase
    {
        [HttpPost]
        public IActionResult Post() => Ok();
    }
}
""";

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = aspNetCoreStubsWithRoles + testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Reports_inherited_unauthorized_action_when_derived_declares_static_NonAction_helper()
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

    public sealed class DerivedWithStaticNonActionHelperController : SharedUnauthenticatedGetController
    {
        [NonAction]
        public static IActionResult Helper() => null!;
    }
}
""";

        DiagnosticResult expectedOnAbstract = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(39, 27, 39, 61)
            .WithArguments("SharedUnauthenticatedGetController");

        DiagnosticResult expectedOnDerived = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(45, 25, 45, 67)
            .WithArguments("SharedUnauthenticatedGetController.InheritedGet()");

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedOnAbstract, expectedOnDerived },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_AL0001_on_undecorated_action_when_type_level_Authorize_Roles_applies_even_with_anonymous_sibling()
    {
        string aspNetCoreStubsWithRoles = AspNetCoreStubs.Replace(
            """
    public class AuthorizeAttribute : System.Attribute
    {
    }
""",
            """
    public class AuthorizeAttribute : System.Attribute
    {
        public string? Roles { get; set; }
    }
""",
            StringComparison.Ordinal);

        const string testCode = """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    [Authorize(Roles = "Admin")]
    public sealed class MixedRoleAndAnonymousController : ControllerBase
    {
        [HttpPost]
        [AllowAnonymous]
        public IActionResult AnonymousPost() => Ok();

        [HttpPost]
        public IActionResult UnsecuredPost() => Ok();
    }
}
""";

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = aspNetCoreStubsWithRoles + testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Reports_inherited_unauthorized_action_when_derived_declares_NonAction_property()
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

    public sealed class DerivedWithNonActionPropertyController : SharedUnauthenticatedGetController
    {
        [NonAction]
        public string RouteHint => "probe";
    }
}
""";

        DiagnosticResult expectedOnAbstract = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(39, 27, 39, 61)
            .WithArguments("SharedUnauthenticatedGetController");

        DiagnosticResult expectedOnDerived = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(45, 25, 45, 63)
            .WithArguments("SharedUnauthenticatedGetController.InheritedGet()");

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedOnAbstract, expectedOnDerived },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_AL0001_for_role_decorated_action_when_controller_has_type_level_AllowAnonymous()
    {
        string aspNetCoreStubsWithRoles = AspNetCoreStubs.Replace(
            """
    public class AuthorizeAttribute : System.Attribute
    {
    }
""",
            """
    public class AuthorizeAttribute : System.Attribute
    {
        public string? Roles { get; set; }
    }
""",
            StringComparison.Ordinal);

        const string testCode = """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    [AllowAnonymous]
    public sealed class AnonymousControllerWithRoleDecoratedAction : ControllerBase
    {
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public IActionResult RolePost() => Ok();
    }
}
""";

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = aspNetCoreStubsWithRoles + testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Reports_inherited_unauthorized_action_when_derived_has_NonAction_explicit_interface_implementation()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Mvc;

    public interface IProbeHelper
    {
        void Helper();
    }

    public abstract class {|#0:SharedUnauthenticatedGetController|} : ControllerBase
    {
        [HttpGet]
        public IActionResult InheritedGet() => Ok();
    }

    public sealed class {|#1:DerivedWithNonActionExplicitImplController|} : SharedUnauthenticatedGetController, IProbeHelper
    {
        [NonAction]
        void IProbeHelper.Helper()
        {
        }
    }
}
""";

        DiagnosticResult expectedOnAbstract = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithLocation(0)
            .WithArguments("SharedUnauthenticatedGetController");

        DiagnosticResult expectedOnDerived = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithLocation(1)
            .WithArguments("SharedUnauthenticatedGetController.InheritedGet()");

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedOnAbstract, expectedOnDerived },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Does_not_report_derived_controller_when_base_has_type_level_AllowAnonymous_even_with_new_Authorize_action()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    [AllowAnonymous]
    public abstract class AnonymousBaseController : ControllerBase
    {
        [HttpGet]
        public IActionResult InheritedGet() => Ok();
    }

    public sealed class DerivedWithAuthorizedPostController : AnonymousBaseController
    {
        [Authorize]
        [HttpPost]
        public IActionResult AuthorizedPost() => Ok();
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
    public async Task Reports_inherited_unauthorized_explicit_interface_when_interface_has_type_level_AllowAnonymous()
    {
        const string testCode = AspNetCoreStubs +
            """

namespace N
{
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    [AllowAnonymous]
    public interface IUnsecuredApi
    {
        IActionResult Post();
    }

    public abstract class {|#0:SharedBase|} : ControllerBase, IUnsecuredApi
    {
        [HttpPost]
        IActionResult IUnsecuredApi.{|#1:Post|}() => Ok();
    }

    public sealed class {|#2:DerivedController|} : SharedBase
    {
    }
}
""";

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            ExpectedDiagnostics =
            {
                CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
                    .WithLocation(2)
                    .WithArguments("SharedBase.IUnsecuredApi.Post()")
            },
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
    }

    [Fact]
    public async Task Reports_inherited_unauthorized_action_when_derived_uses_primary_constructor_only()
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

    public sealed class {|#1:DerivedWithPrimaryCtorController|}(int probeId) : SharedUnauthenticatedGetController
    {
    }
}
""";

        DiagnosticResult expectedOnAbstract = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithSpan(39, 27, 39, 61)
            .WithArguments("SharedUnauthenticatedGetController");

        DiagnosticResult expectedOnDerived = CSharpAnalyzerVerifier<RequireAuthorizationAnalyzer, DefaultVerifier>.Diagnostic(Al0001Descriptor.Rule)
            .WithLocation(1)
            .WithArguments("SharedUnauthenticatedGetController.InheritedGet()");

        await new CSharpAnalyzerTest<RequireAuthorizationAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedOnAbstract, expectedOnDerived },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { ProductAssemblyNameTransform }
        }.RunAsync();
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
