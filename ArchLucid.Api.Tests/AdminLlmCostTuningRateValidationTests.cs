using System.Globalization;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AdminLlmCostTuningRateValidationTests
{
    [Theory]
    [InlineData("0", "1")]
    [InlineData("1", "-1")]
    [InlineData("0.000000004", "1")]
    [InlineData("1", "10000000000")]
    public async Task Invalid_rates_return_validation_problem_without_writing_or_auditing(string input, string output)
    {
        var repository = MakeRepository();
        var audit = MakeAuditService();
        var cache = new LlmCostEstimationUsdRateOverrideCache();
        using var services = MakeServices(repository, cache);
        var controller = MakeController(services, audit);

        var result = await controller.PostLlmCostTuningAsync(MakeRequest(input, output), CancellationToken.None);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);
        Assert.IsType<Microsoft.AspNetCore.Mvc.ProblemDetails>(objectResult.Value);
        repository.VerifyNoOtherCalls();
        audit.VerifyNoOtherCalls();
        Assert.False(cache.TryGetUsdPerMillionRates(out _, out _));
    }

    [Theory]
    [InlineData("1.25", "2.50")]
    [InlineData("0.000000005", "9999999999.99999999")]
    public async Task Valid_rates_preserve_the_persistence_cache_and_audit_path(string input, string output)
    {
        var repository = MakeRepository();
        var audit = MakeAuditService();
        var cache = new LlmCostEstimationUsdRateOverrideCache();
        using var services = MakeServices(repository, cache);
        var controller = MakeController(services, audit);
        var request = MakeRequest(input, output);

        var result = await controller.PostLlmCostTuningAsync(request, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
        repository.Verify(r => r.UpsertAsync(request.InputUsdPerMillionTokens, request.OutputUsdPerMillionTokens,
            "operator", CancellationToken.None), Times.Once);
        repository.Verify(r => r.TryGetAsync(CancellationToken.None), Times.Once);
        audit.Verify(a => a.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.LlmCostTuningUpdated),
            CancellationToken.None), Times.Once);
        Assert.True(cache.TryGetUsdPerMillionRates(out var cachedInput, out var cachedOutput));
        Assert.Equal(2m, cachedInput);
        Assert.Equal(3m, cachedOutput);
    }

    private static LlmCostTuningRequest MakeRequest(string input, string output) => new()
    {
        InputUsdPerMillionTokens = decimal.Parse(input, CultureInfo.InvariantCulture),
        OutputUsdPerMillionTokens = decimal.Parse(output, CultureInfo.InvariantCulture),
    };

    private static Mock<ILlmCostEstimationUsdRateOverrideRepository> MakeRepository()
    {
        var repository = new Mock<ILlmCostEstimationUsdRateOverrideRepository>();
        repository.Setup(r => r.UpsertAsync(It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<string>(),
            It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        repository.Setup(r => r.TryGetAsync(It.IsAny<CancellationToken>())).ReturnsAsync(
            new LlmCostEstimationUsdRateOverrideRow { InputUsdPerMillionTokens = 2m, OutputUsdPerMillionTokens = 3m });
        return repository;
    }

    private static Mock<IAuditService> MakeAuditService()
    {
        var audit = new Mock<IAuditService>();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        return audit;
    }

    private static ServiceProvider MakeServices(Mock<ILlmCostEstimationUsdRateOverrideRepository> repository,
        LlmCostEstimationUsdRateOverrideCache cache) => new ServiceCollection()
            .AddSingleton(repository.Object)
            .AddSingleton(cache)
            .BuildServiceProvider();

    private static AdminLlmCostTuningController MakeController(IServiceProvider services, Mock<IAuditService> audit)
    {
        var actor = new Mock<IActorContext>();
        actor.Setup(a => a.GetActorId()).Returns("operator");
        return new AdminLlmCostTuningController(actor.Object, audit.Object, Mock.Of<IRegisteredAgentHandlersInspector>())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { RequestServices = services }
            }
        };
    }
}
