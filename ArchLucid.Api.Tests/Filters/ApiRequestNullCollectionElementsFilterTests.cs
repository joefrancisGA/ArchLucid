using System.Reflection;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Controllers.Authority;
using ArchLucid.Api.Filters;
using ArchLucid.Api.Models.Coverage;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Host.Core.ProblemDetails;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Routing;

namespace ArchLucid.Api.Tests.Filters;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class ApiRequestNullCollectionElementsFilterTests
{
    [Fact]
    public async Task OnActionExecutionAsync_rejects_from_body_with_null_collection_element()
    {
        ApiRequestNullCollectionElementsFilter sut = new();
        PutRunCoverageAcknowledgementRequest body = new()
        {
            Entries = new RunCoverageAcknowledgementEntryRequest[] { null! },
        };

        MethodInfo coverageMethod = typeof(RunCoverageController).GetMethod(
            nameof(RunCoverageController.PutAcknowledgedCoverage),
            BindingFlags.Instance | BindingFlags.Public)
            ?? throw new InvalidOperationException(nameof(RunCoverageController.PutAcknowledgedCoverage));

        ActionExecutingContext executing = BuildBodyExecutingContext(
            coverageMethod,
            body,
            "/v1/runs/test/coverage/acknowledgement");
        bool next = false;

        await sut.OnActionExecutionAsync(
            executing,
            () =>
            {
                next = true;

                return Task.FromResult(new ActionExecutedContext(executing, [], new object()));
            });

        next.Should().BeFalse();
        ObjectResult result = executing.Result.Should().BeOfType<ObjectResult>().Subject;
        result.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        result.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>()
            .Which.Type.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public async Task OnActionExecutionAsync_rejects_from_body_with_null_non_nullable_collection_property()
    {
        ApiRequestNullCollectionElementsFilter sut = new();
        WorkspaceAllowedEngineSetUpdateRequest body = new()
        {
            AllowedAliasIds = null!,
            DefaultAliasId = "gpt-4",
        };

        MethodInfo method = typeof(SettingsController).GetMethod(
            nameof(SettingsController.PutAllowedEngineSet),
            BindingFlags.Instance | BindingFlags.Public)
            ?? throw new InvalidOperationException(nameof(SettingsController.PutAllowedEngineSet));

        ActionExecutingContext executing = BuildBodyExecutingContext(method, body, "/v1/admin/settings/allowed-engine-set");
        bool next = false;

        await sut.OnActionExecutionAsync(
            executing,
            () =>
            {
                next = true;

                return Task.FromResult(new ActionExecutedContext(executing, [], new object()));
            });

        next.Should().BeFalse();
        ObjectResult result = executing.Result.Should().BeOfType<ObjectResult>().Subject;
        result.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        result.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>()
            .Which.Type.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public async Task OnActionExecutionAsync_rejects_batch_from_body_with_null_array_element()
    {
        ApiRequestNullCollectionElementsFilter sut = new();
        IReadOnlyList<ArchitectureRequest> body = new List<ArchitectureRequest> { null! };

        MethodInfo method = typeof(RunsController).GetMethod(
            nameof(RunsController.CreateRunBatch),
            BindingFlags.Instance | BindingFlags.Public)
            ?? throw new InvalidOperationException(nameof(RunsController.CreateRunBatch));

        ActionExecutingContext executing = BuildBodyExecutingContext(method, body, "/v1/runs/request/batch");
        bool next = false;

        await sut.OnActionExecutionAsync(
            executing,
            () =>
            {
                next = true;

                return Task.FromResult(new ActionExecutedContext(executing, [], new object()));
            });

        next.Should().BeFalse();
        ObjectResult result = executing.Result.Should().BeOfType<ObjectResult>().Subject;
        result.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        result.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>()
            .Which.Type.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public async Task OnActionExecutionAsync_allows_valid_from_body()
    {
        ApiRequestNullCollectionElementsFilter sut = new();
        PutRunCoverageAcknowledgementRequest body = new() { Entries = [] };

        MethodInfo method = typeof(RunCoverageController).GetMethod(
            nameof(RunCoverageController.PutAcknowledgedCoverage),
            BindingFlags.Instance | BindingFlags.Public)
            ?? throw new InvalidOperationException(nameof(RunCoverageController.PutAcknowledgedCoverage));

        ActionExecutingContext executing = BuildBodyExecutingContext(method, body, "/v1/runs/test/coverage/acknowledgement");
        bool next = false;

        await sut.OnActionExecutionAsync(
            executing,
            () =>
            {
                next = true;

                return Task.FromResult(new ActionExecutedContext(executing, [], new object()));
            });

        next.Should().BeTrue();
        executing.Result.Should().BeNull();
    }

    private static ActionExecutingContext BuildBodyExecutingContext(MethodInfo method, object body, string path)
    {
        ParameterInfo bodyParameter = method.GetParameters().Single(static parameter =>
            parameter.GetCustomAttribute<FromBodyAttribute>() is not null);

        ControllerParameterDescriptor parameterDescriptor = new()
        {
            Name = bodyParameter.Name!,
            ParameterType = bodyParameter.ParameterType,
            ParameterInfo = bodyParameter,
            BindingInfo = new BindingInfo { BindingSource = BindingSource.Body },
        };

        ControllerActionDescriptor descriptor = new()
        {
            ControllerTypeInfo = method.DeclaringType!.GetTypeInfo(),
            MethodInfo = method,
            Parameters = [parameterDescriptor],
        };

        DefaultHttpContext httpContext = new() { Request = { Path = path } };

        ActionContext actionContext = new(
            httpContext,
            new RouteData(),
            descriptor,
            new ModelStateDictionary());

        Dictionary<string, object?> arguments = new()
        {
            [bodyParameter.Name!] = body,
        };

        return new ActionExecutingContext(
            actionContext,
            [],
            arguments,
            controller: null!);
    }
}
