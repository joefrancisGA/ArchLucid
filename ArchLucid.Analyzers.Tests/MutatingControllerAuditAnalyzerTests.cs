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

    public class HttpMethodAttribute : System.Attribute
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
    public async Task AL0003_is_absent_when_LogAsync_is_in_static_local_iterator()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class StaticLocalIteratorAuditedController(IAuditService auditService) : ControllerBase
{
    [HttpPost]
    public async System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        await foreach (int _ in ReadAsync(auditService, cancellationToken))
        {
        }

        return Ok();

        static async System.Collections.Generic.IAsyncEnumerable<int> ReadAsync(
            IAuditService audit,
            System.Threading.CancellationToken ct)
        {
            await audit.LogAsync(new AuditEvent { EventType = "Probe" }, ct);
            yield return 1;
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
    public async Task AL0003_reports_when_LogAsync_runs_only_in_primary_constructor_field_initializer()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class FieldInitializerAuditController(IAuditService auditService) : ControllerBase
{
    private readonly System.Threading.Tasks.Task _constructed =
        auditService.LogAsync(new AuditEvent { EventType = "Probe" }, default);

    [HttpPost]
    public IActionResult {|#0:Post|}()
    {
        _ = _constructed;
        return Ok();
    }
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.FieldInitializerAuditController.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
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
    public async Task AL0003_is_absent_when_default_interface_body_calls_LogAsync_on_concrete_audit_service()
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

public interface IDefaultConcreteAuditedApi
{
    [HttpPost("x")]
    async System.Threading.Tasks.Task<IActionResult> Post(
        ConcreteAuditService auditService,
        System.Threading.CancellationToken cancellationToken)
    {
        await auditService.LogAsync(
            new AuditEvent { EventType = "Probe" },
            cancellationToken);

        return null!;
    }
}

public sealed class DefaultInterfaceConcreteAuditedController(ConcreteAuditService auditService)
    : ControllerBase, IDefaultConcreteAuditedApi
{
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
    public async Task AL0003_reports_when_AcceptVerbs_mixed_get_and_post_lacks_IAudit_LogAsync()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class AcceptVerbsMixedVerbsController(IAuditService auditService) : ControllerBase
{
    [AcceptVerbs("GET", "POST")]
    public System.Threading.Tasks.Task<IActionResult> {|#0:Upsert|}(System.Threading.CancellationToken cancellationToken)
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
                .WithArguments("ArchLucid.Api.Probe.AcceptVerbsMixedVerbsController.Upsert");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_AcceptVerbs_post_action_lacks_IAudit_LogAsync()
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
    public IActionResult {|#0:PostNotAllowed|}()
    {
        return Ok();
    }
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.AcceptVerbsPostController.PostNotAllowed");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
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
    public async Task AL0003_reports_when_explicit_interface_implementation_has_empty_block_body_and_interface_declares_HttpPost()
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

public sealed class ExplicitInterfaceEmptyBodyController(IAuditService auditService) : ControllerBase, IMutatingApi
{
    System.Threading.Tasks.Task<IActionResult> IMutatingApi.{|#0:Post|}(System.Threading.CancellationToken cancellationToken)
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
                .WithArguments("ArchLucid.Api.Probe.ExplicitInterfaceEmptyBodyController.ArchLucid.Api.Probe.IMutatingApi.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_explicit_interface_implementation_has_empty_block_body_without_LogAsync()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IDeleteApi
{
    System.Threading.Tasks.Task<IActionResult> Delete(System.Threading.CancellationToken cancellationToken);
}

public sealed class ExplicitInterfaceEmptyBodyController(IAuditService auditService) : ControllerBase, IDeleteApi
{
    [HttpMethod("DELETE")]
    System.Threading.Tasks.Task<IActionResult> IDeleteApi.{|#0:Delete|}(System.Threading.CancellationToken cancellationToken)
    {
    }
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.ExplicitInterfaceEmptyBodyController.ArchLucid.Api.Probe.IDeleteApi.Delete");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics =
            {
                expectedDiagnostic,
                DiagnosticResult.CompilerError("CS0161").WithSpan(93, 59, 93, 65)
                    .WithArguments(
                        "ArchLucid.Api.Probe.ExplicitInterfaceEmptyBodyController.ArchLucid.Api.Probe.IDeleteApi.Delete(System.Threading.CancellationToken)")
            },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_HttpMethod_patch_on_explicit_interface_implementation()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IPatchApi
{
    System.Threading.Tasks.Task<IActionResult> Patch(System.Threading.CancellationToken cancellationToken);
}

public sealed class ExplicitInterfaceHttpMethodPatchController(IAuditService auditService) : ControllerBase, IPatchApi
{
    [HttpMethod("PATCH")]
    System.Threading.Tasks.Task<IActionResult> IPatchApi.{|#0:Patch|}(System.Threading.CancellationToken cancellationToken)
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
                .WithArguments("ArchLucid.Api.Probe.ExplicitInterfaceHttpMethodPatchController.ArchLucid.Api.Probe.IPatchApi.Patch");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_HttpMethod_methods_array_put_on_explicit_interface_implementation()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IPutApi
{
    System.Threading.Tasks.Task<IActionResult> Put(System.Threading.CancellationToken cancellationToken);
}

public sealed class ExplicitInterfaceHttpMethodPutController(IAuditService auditService) : ControllerBase, IPutApi
{
    [HttpMethod(Methods = new[] { "PUT" })]
    System.Threading.Tasks.Task<IActionResult> IPutApi.{|#0:Put|}(System.Threading.CancellationToken cancellationToken)
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
                .WithArguments("ArchLucid.Api.Probe.ExplicitInterfaceHttpMethodPutController.ArchLucid.Api.Probe.IPutApi.Put");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_HttpMethod_delete_on_explicit_interface_implementation()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IDeleteApi
{
    System.Threading.Tasks.Task<IActionResult> Delete(System.Threading.CancellationToken cancellationToken);
}

public sealed class ExplicitInterfaceHttpMethodDeleteController(IAuditService auditService) : ControllerBase, IDeleteApi
{
    [HttpMethod("DELETE")]
    System.Threading.Tasks.Task<IActionResult> IDeleteApi.{|#0:Delete|}(System.Threading.CancellationToken cancellationToken)
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
                .WithArguments("ArchLucid.Api.Probe.ExplicitInterfaceHttpMethodDeleteController.ArchLucid.Api.Probe.IDeleteApi.Delete");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_HttpMethod_named_property_on_explicit_interface_implementation_declares_post()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IMutatingApi
{
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken);
}

public sealed class ExplicitInterfaceHttpMethodController(IAuditService auditService) : ControllerBase, IMutatingApi
{
    [HttpMethod(Method = "POST")]
    System.Threading.Tasks.Task<IActionResult> IMutatingApi.{|#0:Post|}(System.Threading.CancellationToken cancellationToken)
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
                .WithArguments("ArchLucid.Api.Probe.ExplicitInterfaceHttpMethodController.ArchLucid.Api.Probe.IMutatingApi.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_HttpPost_is_declared_on_explicit_interface_implementation()
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

public sealed class ExplicitInterfacePostController(IAuditService auditService) : ControllerBase, IMutatingApi
{
    System.Threading.Tasks.Task<IActionResult> IMutatingApi.{|#0:Post|}(System.Threading.CancellationToken cancellationToken)
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
                .WithArguments("ArchLucid.Api.Probe.ExplicitInterfacePostController.ArchLucid.Api.Probe.IMutatingApi.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_is_absent_when_LogAsync_is_in_local_function_inside_explicit_interface_implementation()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface ILocalFunctionMutatingApi
{
    [HttpPost("x")]
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken);
}

public sealed class ExplicitInterfaceLocalFunctionAuditedController(IAuditService auditService) : ControllerBase, ILocalFunctionMutatingApi
{
    System.Threading.Tasks.Task<IActionResult> ILocalFunctionMutatingApi.Post(System.Threading.CancellationToken cancellationToken)
    {
        return LogAndReturnAsync(cancellationToken);

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
    public async Task Mutating_audit_excluded_on_default_interface_method_suppresses_AL0003()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IDefaultMutatingApi
{
    [HttpPost("x")]
    [MutatingAuditExcluded("default-interface exclusion")]
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(null!);
    }
}

public sealed class DefaultInterfaceMethodExcludedController(IAuditService auditService)
    : ControllerBase, IDefaultMutatingApi
{
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
    public async Task Mutating_audit_excluded_on_controller_type_suppresses_AL0003_for_default_interface_member()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IDefaultMutatingApi
{
    [HttpPost("x")]
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(null!);
    }
}

[MutatingAuditExcluded("controller shell")]
public sealed class ExcludedShellDefaultInterfaceController(IAuditService auditService)
    : ControllerBase, IDefaultMutatingApi
{
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
    public async Task AL0003_reports_mutating_explicit_interface_action_in_referenced_controller_base_assembly()
    {
        MetadataReference sharedControllerReference = BuildSharedExplicitInterfaceControllerReference();
        CSharpCompilation apiCompilation = CSharpCompilation.Create(
            "ArchLucid.Api",
            [
                CSharpSyntaxTree.ParseText(
                    """
namespace ArchLucid.Api.Probe
{
    public sealed class ReferencedExplicitInterfaceDerivedController : Shared.Controllers.SharedExplicitInterfaceMutatingController
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
            diagnostic.GetMessage().Contains("SharedExplicitInterfaceMutatingController", StringComparison.Ordinal));
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
    public async Task AL0003_reports_when_HttpMethod_methods_array_includes_post_without_IAudit_LogAsync()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class HttpMethodMixedVerbsController(IAuditService auditService) : ControllerBase
{
    [HttpMethod(Methods = new[] { "GET", "POST" })]
    public System.Threading.Tasks.Task<IActionResult> {|#0:Upsert|}(System.Threading.CancellationToken cancellationToken)
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
                .WithArguments("ArchLucid.Api.Probe.HttpMethodMixedVerbsController.Upsert");

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
    public async Task AL0003_reports_mutating_action_in_referenced_controller_base_when_only_AcceptVerbs_post()
    {
        MetadataReference sharedControllerReference = BuildSharedAcceptVerbsControllerReference();
        CSharpCompilation apiCompilation = CSharpCompilation.Create(
            "ArchLucid.Api",
            [
                CSharpSyntaxTree.ParseText(
                    """
namespace ArchLucid.Api.Probe
{
    public sealed class ReferencedAcceptVerbsDerivedController : Shared.Controllers.SharedAcceptVerbsMutatingController
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
            diagnostic.GetMessage().Contains("SharedAcceptVerbsMutatingController.Post", StringComparison.Ordinal));
    }

    [Fact]
    public async Task AL0003_reports_when_AcceptVerbs_lowercase_post_action_lacks_IAudit_LogAsync()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class AcceptVerbsLowercasePostController(IAuditService auditService) : ControllerBase
{
    [AcceptVerbs("post")]
    public IActionResult {|#0:PostNotAllowed|}() => Ok();
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                Al0003MutatingControllerAuditDescriptor.Rule)
            .WithLocation(0)
            .WithArguments("ArchLucid.Api.Probe.AcceptVerbsLowercasePostController.PostNotAllowed");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_HttpPost_action_uses_dynamic_LogAsync_because_audit_is_not_statically_resolved()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class DynamicAuditedController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public async System.Threading.Tasks.Task<IActionResult> {|#0:Post|}(System.Threading.CancellationToken cancellationToken)
    {
        await ((dynamic)auditService).LogAsync(new AuditEvent { EventType = "Probe" }, cancellationToken);

        return Ok();
    }
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.DynamicAuditedController.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_HttpPost_action_audits_through_delegate_instead_of_LogAsync()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using System;
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class DelegateAuditedController(IAuditService auditService) : ControllerBase
{
    private readonly Func<AuditEvent, System.Threading.CancellationToken, System.Threading.Tasks.Task> writeAudit =
        (auditEvent, cancellationToken) => auditService.LogAsync(auditEvent, cancellationToken);

    [HttpPost("x")]
    public async System.Threading.Tasks.Task<IActionResult> {|#0:Post|}(System.Threading.CancellationToken cancellationToken)
    {
        await writeAudit(new AuditEvent { EventType = "Probe" }, cancellationToken);

        return Ok();
    }
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.DelegateAuditedController.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_does_not_track_custom_HttpMethod_subclass_verbs_property()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace Microsoft.AspNetCore.Mvc
{
    public sealed class PostVerbsAttribute : HttpMethodAttribute
    {
        public PostVerbsAttribute()
        {
        }

        public string[] Verbs { get; set; } = System.Array.Empty<string>();
    }
}

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class CustomVerbsController(IAuditService auditService) : ControllerBase
{
    [PostVerbs(Verbs = new[] { "POST" })]
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
    public async Task AL0003_is_absent_when_LogAsync_runs_inside_await_foreach_body()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using System.Collections.Generic;
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class ForeachAuditedController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public async System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        await foreach (AuditEvent auditEvent in EnumerateEvents())
        {
            await auditService.LogAsync(auditEvent, cancellationToken);
        }

        return Ok();
    }

    private static async IAsyncEnumerable<AuditEvent> EnumerateEvents()
    {
        yield return new AuditEvent { EventType = "Probe" };

        await System.Threading.Tasks.Task.CompletedTask;
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
    public async Task AL0003_reports_when_HttpPost_action_only_uses_nameof_LogAsync()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class NameofLogAsyncController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public System.Threading.Tasks.Task<IActionResult> {|#0:Post|}(System.Threading.CancellationToken cancellationToken)
    {
        _ = nameof(auditService.LogAsync);

        return System.Threading.Tasks.Task.FromResult<IActionResult>(Ok());
    }
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.NameofLogAsyncController.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_is_absent_when_LogAsync_uses_conditional_access()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class ConditionalAccessAuditedController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public async System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        await auditService?.LogAsync(new AuditEvent { EventType = "Probe" }, cancellationToken)!;

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
    public async Task AL0003_reports_when_HttpPost_action_only_references_LogAsync_method_group()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using System;
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class MethodGroupController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public System.Threading.Tasks.Task<IActionResult> {|#0:Post|}(System.Threading.CancellationToken cancellationToken)
    {
        Func<AuditEvent, System.Threading.CancellationToken, System.Threading.Tasks.Task> writeAudit = auditService.LogAsync;

        return System.Threading.Tasks.Task.FromResult<IActionResult>(Ok());
    }
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.MethodGroupController.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
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
    public async Task AL0003_reports_when_AcceptVerbs_post_on_explicit_interface_implementation()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IMutatingApi
{
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken);
}

public sealed class ExplicitInterfaceAcceptVerbsController(IAuditService auditService) : ControllerBase, IMutatingApi
{
    [AcceptVerbs("POST")]
    System.Threading.Tasks.Task<IActionResult> IMutatingApi.{|#0:Post|}(System.Threading.CancellationToken cancellationToken)
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
                .WithArguments("ArchLucid.Api.Probe.ExplicitInterfaceAcceptVerbsController.ArchLucid.Api.Probe.IMutatingApi.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
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

    private static MetadataReference BuildSharedAcceptVerbsControllerReference()
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

public abstract class SharedAcceptVerbsMutatingController : ControllerBase
{
    [AcceptVerbs("POST")]
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

    private static MetadataReference BuildSharedExplicitInterfaceControllerReference()
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

public interface ISharedMutatingApi
{
    [HttpPost("x")]
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken);
}

public abstract class SharedExplicitInterfaceMutatingController : ControllerBase, ISharedMutatingApi
{
    System.Threading.Tasks.Task<IActionResult> ISharedMutatingApi.Post(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(Ok());
    }
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

    private static MetadataReference BuildSharedDefaultInterfaceMutatingReference()
    {
        CSharpCompilation compilation = CSharpCompilation.Create(
            "Shared.Contracts",
            [
                CSharpSyntaxTree.ParseText(
                    AuditAndMvcStubs +
                    """

namespace Shared.Contracts
{
using Microsoft.AspNetCore.Mvc;

public interface ISharedMutatingDefaultApi
{
    [HttpPost("x")]
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(null!);
    }
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

    [Fact]
    public async Task AL0003_reports_when_controller_inherits_mutating_default_interface_implementation_without_audit()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IMutatingDefaultApi
{
    [HttpPost("x")]
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(null!);
    }
}

public sealed class {|#0:DefaultInterfaceMutatingController|}(IAuditService auditService) : ControllerBase, IMutatingDefaultApi
{
}
}
""";

        DiagnosticResult expectedDiagnostic =
            CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                    Al0003MutatingControllerAuditDescriptor.Rule)
                .WithLocation(0)
                .WithArguments("ArchLucid.Api.Probe.DefaultInterfaceMutatingController.ArchLucid.Api.Probe.IMutatingDefaultApi.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expectedDiagnostic },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_is_absent_when_default_interface_implementation_body_calls_LogAsync_via_extension_method()
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

public interface IMutatingDefaultApi
{
    [HttpPost("x")]
    System.Threading.Tasks.Task<IActionResult> Post(
        IAuditService auditService,
        System.Threading.CancellationToken cancellationToken)
    {
        return auditService.LogAsync(new AuditEvent { EventType = "Probe" }, cancellationToken)
            .ContinueWith<IActionResult>(_ => null!, cancellationToken);
    }
}

public sealed class DefaultInterfaceExtensionAuditedController(IAuditService auditService)
    : ControllerBase, IMutatingDefaultApi
{
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
    public async Task AL0003_reports_when_controller_inherits_unaudited_mutating_default_interface_from_referenced_assembly()
    {
        MetadataReference sharedDefaultInterfaceReference = BuildSharedDefaultInterfaceMutatingReference();
        CSharpCompilation apiCompilation = CSharpCompilation.Create(
            "ArchLucid.Api",
            [
                CSharpSyntaxTree.ParseText(
                    AuditAndMvcStubs +
                    """

namespace ArchLucid.Api.Probe
{
using Microsoft.AspNetCore.Mvc;
using Shared.Contracts;

public sealed class ReferencedDefaultInterfaceMutatingController : ControllerBase, ISharedMutatingDefaultApi
{
}
}
""")
            ],
            TrustedPlatformReferences().Append(sharedDefaultInterfaceReference),
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        ImmutableArray<Diagnostic> diagnostics =
            await apiCompilation
                .WithAnalyzers(ImmutableArray.Create<DiagnosticAnalyzer>(new MutatingControllerAuditAnalyzer()))
                .GetAnalyzerDiagnosticsAsync();

        Assert.Contains(diagnostics, diagnostic =>
            diagnostic.Id == Al0003MutatingControllerAuditDescriptor.Rule.Id &&
            diagnostic.GetMessage().Contains("ReferencedDefaultInterfaceMutatingController", StringComparison.Ordinal) &&
            diagnostic.GetMessage().Contains("ISharedMutatingDefaultApi.Post", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Mutating_audit_excluded_on_outer_nested_shell_suppresses_AL0003_for_nested_default_interface_controller()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IDefaultMutatingApi
{
    [HttpPost("x")]
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(null!);
    }
}

[MutatingAuditExcluded("outer shell")]
public static class ExcludedOuterShell
{
    public sealed class NestedDefaultInterfaceController(IAuditService auditService)
        : ControllerBase, IDefaultMutatingApi
    {
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
    public async Task AL0003_reports_when_default_interface_body_uses_await_using_without_LogAsync()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IDefaultMutatingApi
{
    [HttpPost("x")]
    async System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        await using var _ = new System.IO.MemoryStream();
        return null!;
    }
}

public sealed class {|#0:DefaultInterfaceAwaitUsingController|}(IAuditService auditService)
    : ControllerBase, IDefaultMutatingApi
{
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(Al0003MutatingControllerAuditDescriptor.Rule)
            .WithLocation(0)
            .WithArguments("ArchLucid.Api.Probe.DefaultInterfaceAwaitUsingController.ArchLucid.Api.Probe.IDefaultMutatingApi.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task Mutating_audit_excluded_on_partial_outer_shell_suppresses_AL0003_for_nested_default_interface_controller()
    {
        const string partOne = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IDefaultMutatingApi
{
    [HttpPost("x")]
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(null!);
    }
}

[MutatingAuditExcluded("partial outer")]
public static partial class ExcludedPartialOuterShell
{
}
}
""";

        const string partTwo = """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public static partial class ExcludedPartialOuterShell
{
    public sealed class NestedDefaultInterfaceController(IAuditService auditService)
        : ControllerBase, IDefaultMutatingApi
    {
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

    [Fact]
    public async Task AL0003_reports_when_default_interface_body_uses_synchronous_using_without_LogAsync()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IDefaultMutatingApi
{
    [HttpPost("x")]
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        using var _ = new System.IO.MemoryStream();
        return System.Threading.Tasks.Task.FromResult<IActionResult>(null!);
    }
}

public sealed class {|#0:DefaultInterfaceSyncUsingController|}(IAuditService auditService)
    : ControllerBase, IDefaultMutatingApi
{
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(Al0003MutatingControllerAuditDescriptor.Rule)
            .WithLocation(0)
            .WithArguments("ArchLucid.Api.Probe.DefaultInterfaceSyncUsingController.ArchLucid.Api.Probe.IDefaultMutatingApi.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task Mutating_audit_excluded_on_file_scoped_outer_shell_suppresses_AL0003_for_nested_default_interface_controller()
    {
        const string stubDocument = AuditAndMvcStubs;

        const string probeDocument = """

namespace ArchLucid.Api.Probe;

using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IDefaultMutatingApi
{
    [HttpPost("x")]
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(null!);
    }
}

[MutatingAuditExcluded("file scoped outer")]
public static class ExcludedFileScopedOuterShell
{
    public sealed class NestedDefaultInterfaceController(IAuditService auditService)
        : ControllerBase, IDefaultMutatingApi
    {
    }
}
""";

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestState =
            {
                Sources =
                {
                    ("Stubs.cs", stubDocument),
                    ("Probe.cs", probeDocument),
                },
            },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_default_interface_body_assigns_LogAsync_without_invoking()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

internal static class DefaultInterfaceAuditProbe
{
    public static IAuditService AuditService = null!;
}

public interface IDefaultMutatingApi
{
    [HttpPost("x")]
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        var logAsync = DefaultInterfaceAuditProbe.AuditService.LogAsync;
        return System.Threading.Tasks.Task.FromResult<IActionResult>(null!);
    }
}

public sealed class {|#0:DefaultInterfaceLogAsyncAliasController|}(IAuditService auditService)
    : ControllerBase, IDefaultMutatingApi
{
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(Al0003MutatingControllerAuditDescriptor.Rule)
            .WithLocation(0)
            .WithArguments("ArchLucid.Api.Probe.DefaultInterfaceLogAsyncAliasController.ArchLucid.Api.Probe.IDefaultMutatingApi.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task Mutating_audit_excluded_on_type_alias_outer_shell_suppresses_AL0003_for_nested_default_interface_controller()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

using ExcludedWrapperAlias = ExcludedOuterShellForAliasProbe;

public interface IDefaultMutatingApi
{
    [HttpPost("x")]
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(null!);
    }
}

[MutatingAuditExcluded("alias wrapper outer")]
public static class ExcludedOuterShellForAliasProbe
{
    public sealed class NestedDefaultInterfaceController(IAuditService auditService)
        : ControllerBase, IDefaultMutatingApi
    {
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
    public async Task AL0003_reports_when_default_interface_body_returns_before_any_LogAsync_invocation()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IDefaultMutatingApi
{
    [HttpPost("x")]
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(null!);
    }
}

public sealed class {|#0:DefaultInterfaceEarlyReturnController|}(IAuditService auditService)
    : ControllerBase, IDefaultMutatingApi
{
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(Al0003MutatingControllerAuditDescriptor.Rule)
            .WithLocation(0)
            .WithArguments("ArchLucid.Api.Probe.DefaultInterfaceEarlyReturnController.ArchLucid.Api.Probe.IDefaultMutatingApi.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task Mutating_audit_excluded_on_abstract_base_controller_suppresses_AL0003_for_nested_default_interface_derived()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public interface IDefaultMutatingApi
{
    [HttpPost("x")]
    System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        return System.Threading.Tasks.Task.FromResult<IActionResult>(null!);
    }
}

[MutatingAuditExcluded("excluded base")]
public abstract class ExcludedBaseController : ControllerBase
{
}

public static class ExcludedBaseOuterShell
{
    public sealed class NestedDefaultInterfaceDerivedController(IAuditService auditService)
        : ExcludedBaseController, IDefaultMutatingApi
    {
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
    public async Task AL0003_reports_when_default_interface_defines_local_function_with_LogAsync_but_never_calls_it()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

internal static class DefaultInterfaceLocalFunctionProbe
{
    public static IAuditService AuditService = null!;
}

public interface IDefaultMutatingApi
{
    [HttpPost("x")]
    async System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        async System.Threading.Tasks.Task LogInLocalAsync()
        {
            await DefaultInterfaceLocalFunctionProbe.AuditService.LogAsync(
                new AuditEvent { EventType = "Probe" },
                cancellationToken);
        }

        return null!;
    }
}

public sealed class {|#0:DefaultInterfaceUncalledLocalFunctionController|}(IAuditService auditService)
    : ControllerBase, IDefaultMutatingApi
{
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(Al0003MutatingControllerAuditDescriptor.Rule)
            .WithLocation(0)
            .WithArguments("ArchLucid.Api.Probe.DefaultInterfaceUncalledLocalFunctionController.ArchLucid.Api.Probe.IDefaultMutatingApi.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_HttpPost_body_defines_uncalled_local_function_that_logs()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class UncalledLocalFunctionController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public async System.Threading.Tasks.Task<IActionResult> {|#0:Post|}(System.Threading.CancellationToken cancellationToken)
    {
        async System.Threading.Tasks.Task LogInLocalAsync()
        {
            await auditService.LogAsync(new AuditEvent { EventType = "Probe" }, cancellationToken);
        }

        return Ok();
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                Al0003MutatingControllerAuditDescriptor.Rule)
            .WithLocation(0)
            .WithArguments("ArchLucid.Api.Probe.UncalledLocalFunctionController.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_LogAsync_lives_in_nested_local_never_reached_from_action_entry()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class NestedUncalledLocalController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public async System.Threading.Tasks.Task<IActionResult> {|#0:Post|}(System.Threading.CancellationToken cancellationToken)
    {
        async System.Threading.Tasks.Task OuterLocalAsync()
        {
            await InnerLoggingLocalAsync();
        }

        async System.Threading.Tasks.Task InnerLoggingLocalAsync()
        {
            await auditService.LogAsync(new AuditEvent { EventType = "Probe" }, cancellationToken);
        }

        return Ok();
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                Al0003MutatingControllerAuditDescriptor.Rule)
            .WithLocation(0)
            .WithArguments("ArchLucid.Api.Probe.NestedUncalledLocalController.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_is_absent_when_Post_calls_nested_locals_that_reach_LogAsync()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class NestedCalledLocalController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public async System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        async System.Threading.Tasks.Task OuterLocalAsync()
        {
            await InnerLoggingLocalAsync();
        }

        async System.Threading.Tasks.Task InnerLoggingLocalAsync()
        {
            await auditService.LogAsync(new AuditEvent { EventType = "Probe" }, cancellationToken);
        }

        await OuterLocalAsync();
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
    public async Task AL0003_reports_when_default_interface_await_using_disposes_with_LogAsync_only()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

internal sealed class AuditOnDisposeResource(IAuditService auditService, System.Threading.CancellationToken cancellationToken)
    : System.IAsyncDisposable
{
    public async System.Threading.Tasks.ValueTask DisposeAsync()
    {
        await auditService.LogAsync(new AuditEvent { EventType = "Probe" }, cancellationToken);
    }
}

public interface IDefaultMutatingApi
{
    [HttpPost("x")]
    async System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        await using AuditOnDisposeResource _ = new AuditOnDisposeResource(DefaultInterfaceDisposeProbe.AuditService, cancellationToken);
        return null!;
    }
}

internal static class DefaultInterfaceDisposeProbe
{
    public static IAuditService AuditService = null!;
}

public sealed class {|#0:DefaultInterfaceAwaitUsingDisposeAuditController|}(IAuditService auditService)
    : ControllerBase, IDefaultMutatingApi
{
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(Al0003MutatingControllerAuditDescriptor.Rule)
            .WithLocation(0)
            .WithArguments("ArchLucid.Api.Probe.DefaultInterfaceAwaitUsingDisposeAuditController.ArchLucid.Api.Probe.IDefaultMutatingApi.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_mutually_recursive_locals_with_LogAsync_are_never_invoked_from_entry()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class MutuallyRecursiveLocalController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public async System.Threading.Tasks.Task<IActionResult> {|#0:Post|}(System.Threading.CancellationToken cancellationToken)
    {
        async System.Threading.Tasks.Task LocalAAsync()
        {
            await LocalBAsync();
        }

        async System.Threading.Tasks.Task LocalBAsync()
        {
            await auditService.LogAsync(new AuditEvent { EventType = "Probe" }, cancellationToken);
            await LocalAAsync();
        }

        return Ok();
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                Al0003MutatingControllerAuditDescriptor.Rule)
            .WithLocation(0)
            .WithArguments("ArchLucid.Api.Probe.MutuallyRecursiveLocalController.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_LogAsync_runs_only_from_catch_filter_local()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class CatchFilterLocalAuditController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public async System.Threading.Tasks.Task<IActionResult> {|#0:Post|}(System.Threading.CancellationToken cancellationToken)
    {
        try
        {
            return Ok();
        }
        catch (System.Exception ex) when (LogInCatchFilter(ex, cancellationToken))
        {
            throw;
        }
    }

    bool LogInCatchFilter(System.Exception ex, System.Threading.CancellationToken cancellationToken)
    {
        _ = auditService.LogAsync(new AuditEvent { EventType = "Probe" }, cancellationToken);
        return false;
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                Al0003MutatingControllerAuditDescriptor.Rule)
            .WithLocation(0)
            .WithArguments("ArchLucid.Api.Probe.CatchFilterLocalAuditController.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_default_interface_LogAsync_runs_only_from_catch_filter()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

internal static class DefaultInterfaceCatchFilterProbe
{
    public static IAuditService AuditService = null!;
}

public interface IDefaultMutatingApi
{
    [HttpPost("x")]
    async System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        try
        {
            return null!;
        }
        catch (System.Exception ex) when (LogInCatchFilter(ex, cancellationToken))
        {
            throw;
        }

        bool LogInCatchFilter(System.Exception ex, System.Threading.CancellationToken cancellationToken)
        {
            _ = DefaultInterfaceCatchFilterProbe.AuditService.LogAsync(
                new AuditEvent { EventType = "Probe" },
                cancellationToken);
            return false;
        }
    }
}

public sealed class {|#0:DefaultInterfaceCatchFilterAuditController|}(IAuditService auditService)
    : ControllerBase, IDefaultMutatingApi
{
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(Al0003MutatingControllerAuditDescriptor.Rule)
            .WithLocation(0)
            .WithArguments("ArchLucid.Api.Probe.DefaultInterfaceCatchFilterAuditController.ArchLucid.Api.Probe.IDefaultMutatingApi.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_reports_when_LogAsync_only_in_switch_default_arm_never_selected_by_constant()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class SwitchDefaultArmAuditController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public async System.Threading.Tasks.Task<IActionResult> {|#0:Post|}(System.Threading.CancellationToken cancellationToken)
    {
        switch (1)
        {
            case 1:
                return Ok();
            default:
                await auditService.LogAsync(new AuditEvent { EventType = "Probe" }, cancellationToken);
                return Ok();
        }
    }
}
}
""";

        DiagnosticResult expected = CSharpAnalyzerVerifier<MutatingControllerAuditAnalyzer, DefaultVerifier>.Diagnostic(
                Al0003MutatingControllerAuditDescriptor.Rule)
            .WithLocation(0)
            .WithArguments("ArchLucid.Api.Probe.SwitchDefaultArmAuditController.Post");

        await new CSharpAnalyzerTest<MutatingControllerAuditAnalyzer, DefaultVerifier>
        {
            TestCode = testCode,
            ExpectedDiagnostics = { expected },
            ReferenceAssemblies = ReferenceAssemblies.Net.Net90,
            SolutionTransforms = { MarkAssemblyAsArchLucidApi }
        }.RunAsync();
    }

    [Fact]
    public async Task AL0003_is_absent_when_LogAsync_in_finally_after_try_return()
    {
        const string testCode = AuditAndMvcStubs +
            """

namespace ArchLucid.Api.Probe
{
using ArchLucid.Core.Audit;
using Microsoft.AspNetCore.Mvc;

public sealed class FinallyAuditController(IAuditService auditService) : ControllerBase
{
    [HttpPost("x")]
    public async System.Threading.Tasks.Task<IActionResult> Post(System.Threading.CancellationToken cancellationToken)
    {
        try
        {
            return Ok();
        }
        finally
        {
            await auditService.LogAsync(new AuditEvent { EventType = "Probe" }, cancellationToken);
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

    private static IEnumerable<MetadataReference> TrustedPlatformReferences() =>
        ((string?)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES") ?? string.Empty)
            .Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries)
            .Where(path => !path.Contains("Microsoft.AspNetCore", StringComparison.OrdinalIgnoreCase))
            .Select(path => MetadataReference.CreateFromFile(path));
}
