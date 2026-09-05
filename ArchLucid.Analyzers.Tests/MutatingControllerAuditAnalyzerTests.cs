using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Testing;
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

    private static Solution MarkAssemblyAsArchLucidApi(Solution solution, ProjectId projectId) =>
        solution.WithProjectAssemblyName(projectId, "ArchLucid.Api");
}
