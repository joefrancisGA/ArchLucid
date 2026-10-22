using System.Reflection;

using ArchLucid.Api.Swagger;

using FluentAssertions;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Api")]
[Trait("Category", "Unit")]
public sealed class OpenApiAuthAnonymousDetectionTests
{
    [Fact]
    public void AllowsAnonymous_true_when_allow_anonymous_filter_present()
    {
        ControllerActionDescriptor descriptor = new()
        {
            FilterDescriptors =
            [
                new FilterDescriptor(new AllowAnonymousFilter(), FilterScope.Action),
            ],
            MethodInfo = typeof(OpenApiAuthAnonymousDetectionTests).GetMethod(
                nameof(AllowsAnonymous_true_when_allow_anonymous_filter_present),
                BindingFlags.Instance | BindingFlags.Public)!,
            ControllerTypeInfo = typeof(OpenApiAuthAnonymousDetectionTests).GetTypeInfo(),
        };

        OpenApiAuthAnonymousDetection.AllowsAnonymous(descriptor).Should().BeTrue();
    }

    [Fact]
    public void AllowsAnonymous_true_when_method_has_allow_anonymous_attribute()
    {
        ControllerActionDescriptor descriptor = new()
        {
            FilterDescriptors = [],
            MethodInfo = typeof(AnonymousSampleController).GetMethod(
                nameof(AnonymousSampleController.AnonymousAction),
                BindingFlags.Instance | BindingFlags.Public)!,
            ControllerTypeInfo = typeof(AnonymousSampleController).GetTypeInfo(),
        };

        OpenApiAuthAnonymousDetection.AllowsAnonymous(descriptor).Should().BeTrue();
    }

    [Fact]
    public void AllowsAnonymous_false_when_no_anonymous_metadata()
    {
        ControllerActionDescriptor descriptor = new()
        {
            FilterDescriptors = [],
            MethodInfo = typeof(AnonymousSampleController).GetMethod(
                nameof(AnonymousSampleController.ProtectedAction),
                BindingFlags.Instance | BindingFlags.Public)!,
            ControllerTypeInfo = typeof(AnonymousSampleController).GetTypeInfo(),
        };

        OpenApiAuthAnonymousDetection.AllowsAnonymous(descriptor).Should().BeFalse();
    }

    private sealed class AnonymousSampleController
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
