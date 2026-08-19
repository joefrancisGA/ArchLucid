using System.Reflection;

using ArchLucid.Api.OpenApi;

using FluentAssertions;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi;

namespace ArchLucid.Api.Tests.OpenApi;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class MicrosoftOpenApiAnonymousSecurityOperationTransformerTests
{
    [Fact]
    public async Task TransformAsync_clears_security_for_anonymous_action_when_scheme_configured()
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["ArchLucidAuth:Mode"] = "JwtBearer" }).Build();

        MicrosoftOpenApiAnonymousSecurityOperationTransformer transformer = new(configuration);
        OpenApiOperation operation = new()
        {
            Security = [new OpenApiSecurityRequirement()],
        };

        OpenApiOperationTransformerContext context = new()
        {
            DocumentName = "v1",
            ApplicationServices = new ServiceCollection().BuildServiceProvider(),
            Description = new ApiDescription { ActionDescriptor = CreateAnonymousDescriptor() },
        };

        await transformer.TransformAsync(operation, context, CancellationToken.None);

        operation.Security.Should().BeEmpty();
    }

    [Fact]
    public async Task TransformAsync_leaves_security_when_action_is_not_anonymous()
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["ArchLucidAuth:Mode"] = "JwtBearer" }).Build();

        MicrosoftOpenApiAnonymousSecurityOperationTransformer transformer = new(configuration);
        OpenApiSecurityRequirement requirement = new();
        OpenApiOperation operation = new()
        {
            Security = [requirement],
        };

        OpenApiOperationTransformerContext context = new()
        {
            DocumentName = "v1",
            ApplicationServices = new ServiceCollection().BuildServiceProvider(),
            Description = new ApiDescription { ActionDescriptor = CreateProtectedDescriptor() },
        };

        await transformer.TransformAsync(operation, context, CancellationToken.None);

        operation.Security.Should().ContainSingle().Which.Should().BeSameAs(requirement);
    }

    [Fact]
    public async Task TransformAsync_no_op_when_security_scheme_not_configured()
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>()).Build();

        MicrosoftOpenApiAnonymousSecurityOperationTransformer transformer = new(configuration);
        OpenApiSecurityRequirement requirement = new();
        OpenApiOperation operation = new()
        {
            Security = [requirement],
        };

        OpenApiOperationTransformerContext context = new()
        {
            DocumentName = "v1",
            ApplicationServices = new ServiceCollection().BuildServiceProvider(),
            Description = new ApiDescription { ActionDescriptor = CreateAnonymousDescriptor() },
        };

        await transformer.TransformAsync(operation, context, CancellationToken.None);

        operation.Security.Should().ContainSingle().Which.Should().BeSameAs(requirement);
    }

    private static ControllerActionDescriptor CreateAnonymousDescriptor() =>
        new()
        {
            FilterDescriptors = [],
            MethodInfo = typeof(SampleController).GetMethod(
                nameof(SampleController.AnonymousAction),
                BindingFlags.Instance | BindingFlags.Public)!,
            ControllerTypeInfo = typeof(SampleController).GetTypeInfo(),
        };

    private static ControllerActionDescriptor CreateProtectedDescriptor() =>
        new()
        {
            FilterDescriptors = [],
            MethodInfo = typeof(SampleController).GetMethod(
                nameof(SampleController.ProtectedAction),
                BindingFlags.Instance | BindingFlags.Public)!,
            ControllerTypeInfo = typeof(SampleController).GetTypeInfo(),
        };

    private sealed class SampleController
    {
        [AllowAnonymous]
        public void AnonymousAction()
        {
        }

        public void ProtectedAction()
        {
        }
    }
}
