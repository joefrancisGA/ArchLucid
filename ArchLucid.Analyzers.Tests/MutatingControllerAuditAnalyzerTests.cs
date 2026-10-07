using System.Collections.Immutable;

using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Testing;
using Microsoft.CodeAnalysis.Diagnostics;
using Microsoft.CodeAnalysis.Emit;
using Microsoft.CodeAnalysis.Testing;

namespace ArchLucid.Analyzers.Tests;
[Trait("Category", "Unit")]

public sealed class MutatingControllerAuditAnalyzerTests
{
    /// <summary>
    /// Minimal <c>ArchLucid.Core.Audit</c> + MVC HTTP verb attributes so analyzer metadata names resolve without
    /// wiring the full ASP.NET Core reference set into the ephemeral test compilation.
    /// </summary>
    private const string AuditAndMvcStubs = """

namespace ArchLucid.Core.Audit
{
    public sealed class AuditEvent
    {
        public string EventType { get; set; } = string.Empty;
    }

    public interface IAuditService
    {
        System.Threading.Tasks.Task LogAsync(AuditEvent auditEvent, System.Threading.CancellationToken ct);
    }

    [System.AttributeUsage(System.AttributeTargets.Method | System.AttributeTargets.Class, Inherited = true, AllowMultiple = false)]
    public sealed class MutatingAuditExcludedAttribute : System.Attribute
    {
        public MutatingAuditExcludedAttribute(string? reason = null)
        {
            Reason = reason ?? string.Empty;
        }

        public string Reason { get; }
    }
}

namespace Microsoft.AspNetCore.Mvc
{
    public interface IActionResult { }

    public abstract class ControllerBase
    {
        protected IActionResult Ok() => throw null!;
    }

    public sealed class HttpGetAttribute : System.Attribute { }

    public sealed class HttpPostAttribute : System.Attribute
    {
        public HttpPostAttribute(string? template = null) { }
    }

    public sealed class HttpPutAttribute : System.Attribute
    {
        public HttpPutAttribute(string? template = null) { }
    }

    public sealed class HttpDeleteAttribute : System.Attribute
    {
        public HttpDeleteAttribute(string? template = null) { }
    }

    public sealed class HttpPatchAttribute : System.Attribute
    {
        public HttpPatchAttribute(string? template = null) { }
    }

    public sealed class NonActionAttribute : System.Attribute { }

    public sealed class AcceptVerbsAttribute : System.Attribute
    {
        public AcceptVerbsAttribute(params string[] methods) { }
    }

    public sealed class HttpMethodAttribute : System.Attribute
    {
        public HttpMethodAttribute(string method) { }

        public HttpMethodAttribute(params string[] methods) { }

        public HttpMethodAttribute()
        {
        }

        public string? Method { get; set; }

        public string[]? Methods { get; set; }
    }
}

""";

    [Fact]
    public async Task AL0003_reports_when_HttpPost_action_lacks_IAudit_LogAsync()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class IgnoresAuditController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public System.Threading.Tasks.Task<IActionResult> {|#0:Breaks|}(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(Ok());
    }
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.IgnoresAuditController.Breaks");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_is_absent_when_LogAsync_is_awaited()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class AuditedController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public async System.Threading.Tasks.Task<IActionResult> OkPost(System.Threading.CancellationToken cancellationToken)
    {
        await auditService.LogAsync(
            new AuditEvent { EventType = "Probe" },
            cancellationToken);

        return Ok();
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task Allowlist_additional_text_suppresses_AL0003()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class ListedController(IAuditService auditService) : ControllerBase
{
    [HttpPost]
    public System.Threading.Tasks.Task<IActionResult> Allowlisted(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(Ok());
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            TestState =
            {
                AdditionalFiles =
                {
                    ("controller_action_audit_allowlist.txt",
                        Microsoft.CodeAnalysis.Text.SourceText.From(
                            "ArchLucid.Api.Probe.ListedController.Allowlisted")),
                },
            },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi },
        }.RunAsync();
    }

    [Fact]
    public async Task Mutating_audit_excluded_attribute_suppresses_AL0003()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class ExcludedController : ControllerBase
{
    [HttpPost]
    [MutatingAuditExcluded("test harness")]
    public IActionResult Bypass()
    {
        return Ok();
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task Mutating_audit_excluded_on_base_controller_suppresses_AL0003_on_derived_action()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

[MutatingAuditExcluded("shared base controller")]
public abstract class ExcludedBaseController : ControllerBase
{
}

public sealed class DerivedExcludedController : ExcludedBaseController
{
    [HttpPost]
    public IActionResult Post()
    {
        return Ok();
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_HttpPatch_action_lacks_IAudit_LogAsync()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class PatchIgnoresAuditController(IAuditService auditService) : ControllerBase
{
    [HttpPatch("x")]
    public System.Threading.Tasks.Task<IActionResult> {|#0:Patch|}(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(Ok());
    }
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.PatchIgnoresAuditController.Patch");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task Mutating_audit_excluded_on_base_method_suppresses_AL0003_on_override()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public abstract class ExcludedMethodBaseController : ControllerBase
{
    [HttpPost]
    [MutatingAuditExcluded("base method excluded")]
    public virtual IActionResult Post() => Ok();
}

public sealed class DerivedExcludedMethodController : ExcludedMethodBaseController
{
    public override IActionResult Post() => Ok();
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_HttpPut_action_lacks_IAudit_LogAsync()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class PutIgnoresAuditController(IAuditService auditService) : ControllerBase
{
    [HttpPut("x")]
    public System.Threading.Tasks.Task<IActionResult> {|#0:Put|}(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(Ok());
    }
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.PutIgnoresAuditController.Put");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task NonAction_on_base_method_suppresses_AL0003_on_override()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public abstract class NonActionBaseController : ControllerBase
{
    [NonAction]
    public virtual IActionResult Helper() => Ok();
}

public sealed class DerivedNonActionController : NonActionBaseController
{
    public override IActionResult Helper() => Ok();
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_overridden_action_inherits_HttpPost_from_base()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public abstract class PostBaseController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public virtual System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(Ok());
    }
}

public sealed class DerivedPostController(IAuditService auditService) : PostBaseController(auditService)
{
    public override System.Threading.Tasks.Task<IActionResult> {|#0:Post|}(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(Ok());
    }
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.DerivedPostController.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_override_adds_HttpPost_to_base_NonAction_helper()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public abstract class NonActionBaseController : ControllerBase
{
    [NonAction]
    public virtual IActionResult Helper() => Ok();
}

public sealed class DerivedMutatingHelperController : NonActionBaseController
{
    [HttpPost]
    public override IActionResult {|#0:Helper|}() => Ok();
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.DerivedMutatingHelperController.Helper");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_is_absent_when_LogAsync_is_in_local_function()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class LocalFunctionAuditedController(IAuditService auditService) : ControllerBase
{
    [HttpPost]
    public async System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        return await LogAndReturnAsync(cancellationToken);

        async System.Threading.Tasks.Task<IActionResult> LogAndReturnAsync(System.Threading.CancellationToken ct)
        {
            await auditService.LogAsync(new AuditEvent { EventType = "Probe" }, ct);
            return Ok();
        }
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_HttpDelete_action_lacks_IAudit_LogAsync()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class DeleteIgnoresAuditController(IAuditService auditService) : ControllerBase
{
    [HttpDelete("x")]
    public System.Threading.Tasks.Task<IActionResult> {|#0:Delete|}(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(Ok());
    }
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.DeleteIgnoresAuditController.Delete");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_override_adds_HttpPost_despite_base_MutatingAuditExcluded()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public abstract class ExcludedVirtualBaseController : ControllerBase
{
    [MutatingAuditExcluded("base virtual excluded")]
    public virtual IActionResult Post() => Ok();
}

public sealed class DerivedMutatingPostController : ExcludedVirtualBaseController
{
    [HttpPost]
    public override IActionResult {|#0:Post|}() => Ok();
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.DerivedMutatingPostController.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_is_absent_when_LogAsync_is_called_on_concrete_audit_service()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class ConcreteAuditService : IAuditService
{
    public System.Threading.Tasks.Task LogAsync(AuditEvent auditEvent, System.Threading.CancellationToken ct) =>
        System.Threading.Tasks.Task.CompletedTask;
}

public sealed class ConcreteAuditedController(ConcreteAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public async System.Threading.Tasks.Task<IActionResult> OkPost(System.Threading.CancellationToken cancellationToken)
    {
        await auditService.LogAsync(
            new AuditEvent { EventType = "Probe" },
            cancellationToken);

        return Ok();
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AcceptVerbs_post_does_not_trigger_AL0003()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class AcceptVerbsPostController(IAuditService auditService) : ControllerBase
{
    [AcceptVerbs("POST")]
    public IActionResult PostNotAllowed()
    {
        return Ok();
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_HttpPost_is_declared_on_implemented_interface()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IMutatingApi
{
    [HttpPost("x")]
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken);
}

public sealed class InterfacePostController(IAuditService auditService) : ControllerBase, IMutatingApi
{
    public System.Threading.Tasks.Task<IActionResult> {|#0:Post|}(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(Ok());
    }
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.InterfacePostController.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task Mutating_audit_excluded_on_interface_method_suppresses_AL0003()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IExcludedMutatingApi
{
    [HttpPost("x")]
    [MutatingAuditExcluded("interface-method exclusion")]
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken);
}

public sealed class InterfaceMethodExcludedController(IAuditService auditService) : ControllerBase, IExcludedMutatingApi
{
    public System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(Ok());
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task Http_Get_actions_do_not_require_audit()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class ReadOnlyController(IAuditService auditService) : ControllerBase
{
    [HttpGet]
    public IActionResult Read()
    {
        return Ok();
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_mutating_action_in_referenced_controller_base_assembly()
    {
        MetadataReference sharedControllerReference = BuildSharedControllerReference();
        CSharpCompilation apiCompilation = CSharpCompilation.Create(
            "ArchLucid.Api",
            [
                CSharpSyntaxTree.ParseText(
                    """
namespace ArchLucid.Api.Probe
{
    public sealed class ReferencedBaseDerivedController : Shared.Controllers.SharedMutatingController
    {
    }
}
""")
            ],
            TrustedPlatformReferences().Append(sharedControllerReference),
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        INamedTypeSymbol derivedType =
            apiCompilation.GetTypeByMetadataName("ArchLucid.Api.Probe.ReferencedBaseDerivedController")!;
        Assert.Equal("SharedMutatingController", derivedType.BaseType?.Name);
        IMethodSymbol inheritedPost = derivedType.BaseType!.GetMembers("Post").OfType<IMethodSymbol>().Single();
        Assert.Contains(inheritedPost.GetAttributes(), attribute =>
            attribute.AttributeClass?.Name == "HttpPostAttribute");

        ImmutableArray<Diagnostic> diagnostics =
            await apiCompilation
                .WithAnalyzers(ImmutableArray.Create<DiagnosticAnalyzer>(new MutatingControllerAuditAnalyzer()))
                .GetAnalyzerDiagnosticsAsync();

        Assert.Contains(diagnostics, diagnostic =>
            diagnostic.Id == Al0003MutatingControllerAuditDescriptor.Rule.Id &&
            diagnostic.GetMessage().Contains("SharedMutatingController.Post", StringComparison.Ordinal));
    }

    [Fact]
    public async Task AL0003_reports_one_diagnostic_for_concrete_controller_in_multi_level_referenced_inheritance()
    {
        MetadataReference sharedControllerReference = BuildSharedControllerReference();
        CSharpCompilation apiCompilation = CSharpCompilation.Create(
            "ArchLucid.Api",
            [
                CSharpSyntaxTree.ParseText(
                    """
namespace ArchLucid.Api.Probe
{
    public abstract class IntermediateController : Shared.Controllers.SharedMutatingController
    {
    }

    public sealed class ConcreteController : IntermediateController
    {
    }
}
""")
            ],
            TrustedPlatformReferences().Append(sharedControllerReference),
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        ImmutableArray<Diagnostic> diagnostics =
            await apiCompilation
                .WithAnalyzers(ImmutableArray.Create<DiagnosticAnalyzer>(new MutatingControllerAuditAnalyzer()))
                .GetAnalyzerDiagnosticsAsync();

        Assert.Single(
            diagnostics,
            diagnostic => diagnostic.Id == Al0003MutatingControllerAuditDescriptor.Rule.Id);
    }

    [Fact]
    public async Task AL0003_does_not_report_shadowed_mutating_action_in_deeply_nested_controller()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public abstract class BaseController : ControllerBase
{
    [HttpPost]
    public virtual IActionResult Post() => Ok();
}

public static class Container
{
    public abstract class IntermediateController : BaseController
    {
        public sealed class ConcreteController(IAuditService auditService) : IntermediateController
        {
            public override IActionResult Post()
            {
                auditService.LogAsync(new AuditEvent(), default);
                return Ok();
            }
        }
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_expression_bodied_HttpPost_lacks_IAudit_LogAsync()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using Microsoft.AspNetCore.Mvc;

public sealed class ExpressionBodyController : ControllerBase
{
    [HttpPost("x")]
    public IActionResult {|#0:Post|}() => Ok();
}
}
""";

        DiagnosticResult expectedDiagnostic = CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                Al0003MutatingControllerAuditDescriptor.Rule)
            .WithLocation(0)
            .WithArguments("ArchLucid.Api.Probe.ExpressionBodyController.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_HttpMethod_post_action_lacks_IAudit_LogAsync()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class HttpMethodPostController(IAuditService auditService) : ControllerBase
{
    [HttpMethod("POST")]
    public System.Threading.Tasks.Task<IActionResult> {|#0:Post|}(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(Ok());
    }
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.HttpMethodPostController.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_is_absent_when_LogAsync_is_called_via_extension_method()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Core.Audit
{
public static class AuditServiceExtensions
{
    public static System.Threading.Tasks.Task LogAsync(
        this IAuditService auditService,
        AuditEvent auditEvent,
        System.Threading.CancellationToken cancellationToken) =>
        System.Threading.Tasks.Task.CompletedTask;
}
}

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class ExtensionAuditedController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public async System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        await auditService.LogAsync(new AuditEvent { EventType = "Probe" }, cancellationToken);

        return Ok();
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_HttpMethod_named_property_declares_post_without_constructor_args()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class HttpMethodNamedPropertyController(IAuditService auditService) : ControllerBase
{
    [HttpMethod(Method = "POST")]
    public System.Threading.Tasks.Task<IActionResult> {|#0:Post|}(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(Ok());
    }
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.HttpMethodNamedPropertyController.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_mutating_action_in_referenced_controller_base_when_only_HttpMethod_post()
    {
        MetadataReference sharedControllerReference = BuildSharedHttpMethodControllerReference();
        CSharpCompilation apiCompilation = CSharpCompilation.Create(
            "ArchLucid.Api",
            [
                CSharpSyntaxTree.ParseText(
                    """
namespace ArchLucid.Api.Probe
{
    public sealed class ReferencedHttpMethodDerivedController : Shared.Controllers.SharedHttpMethodMutatingController
    {
    }
}
""")
            ],
            TrustedPlatformReferences().Append(sharedControllerReference),
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        ImmutableArray<Diagnostic> diagnostics =
            await apiCompilation
                .WithAnalyzers(ImmutableArray.Create<DiagnosticAnalyzer>(new MutatingControllerAuditAnalyzer()))
                .GetAnalyzerDiagnosticsAsync();

        Assert.Contains(diagnostics, diagnostic =>
            diagnostic.Id == Al0003MutatingControllerAuditDescriptor.Rule.Id &&
            diagnostic.GetMessage().Contains("SharedHttpMethodMutatingController.Post", StringComparison.Ordinal));
    }

    [Fact]
    public async Task AL0003_is_absent_when_LogAsync_is_called_through_IAuditService_cast()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class CastAuditedController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public async System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        await ((IAuditService)auditService).LogAsync(new AuditEvent { EventType = "Probe" }, cancellationToken);

        return Ok();
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_is_absent_when_LogAsync_lives_on_partial_method_implementation()
    {
        const string partOne = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public partial class PartialAuditedController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public partial System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken);
}
}
""";

        const string partTwo = """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public partial class PartialAuditedController
{
    public async partial System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        await auditService.LogAsync(new AuditEvent { EventType = "Probe" }, cancellationToken);

        return Ok();
    }
}
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestState =
            {
                Sources =
                {
                    ("PartOne.cs", partOne),
                    ("PartTwo.cs", partTwo),
                },
            },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    private static Solution MarkAssemblyAsArchLucidApi(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Api");

    private static MetadataReference BuildSharedControllerReference()
    {
        CSharpCompilation compilation = CSharpCompilation.Create(
            "Shared.Controllers",
            [
                CSharpSyntaxTree.ParseText(
                    AuditAndMvcStubs +
                    """

namespace Shared.Controllers
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public abstract class SharedMutatingController : ControllerBase
{
    [HttpPost("x")]
    public IActionResult Post() => Ok();
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

    private static MetadataReference BuildSharedHttpMethodControllerReference()
    {
        CSharpCompilation compilation = CSharpCompilation.Create(
            "Shared.Controllers",
            [
                CSharpSyntaxTree.ParseText(
                    AuditAndMvcStubs +
                    """

namespace Shared.Controllers
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public abstract class SharedHttpMethodMutatingController : ControllerBase
{
    [HttpMethod("POST")]
    public IActionResult Post() => Ok();
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
            .Where(path => !path.Contains("Microsoft.AspNetCore", StringComparison.OrdinalIgnoreCase))
            .Select(path => MetadataReference.CreateFromFile(path));
}
