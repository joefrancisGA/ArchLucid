using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.QuickScan;
using ArchLucid.Host.Core.ProblemDetails;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers;

/// <summary>Maps <see cref="QuickScanExecutionResult" /> to HTTP responses for Quick Scan controllers.</summary>
internal static class QuickScanHttpResultMapper
{
    public static IActionResult Map(ControllerBase controller, QuickScanExecutionResult result)
    {
        if (result.Succeeded)
        {
            return controller.Ok(result.SuccessBody);
        }

        if (result.FailureKind == QuickScanExecutionFailureKind.Validation)
        {
            return controller.BadRequestProblem(
                result.ValidationDetail ?? "Validation failed.",
                ProblemTypes.ValidationFailed);
        }

        if (result.FailureKind == QuickScanExecutionFailureKind.ConcurrencyRejected)
        {
            return MapConcurrencyRejected(controller, result.ConcurrencyRejectionReason!.Value);
        }

        if (result.FailureKind == QuickScanExecutionFailureKind.GuardRejected)
        {
            return result.GuardRejectionReason switch
            {
                QuickScanGuardRejectionReason.Disabled
                    or QuickScanGuardRejectionReason.GlobalHourlySpendCeiling
                    or QuickScanGuardRejectionReason.GlobalDailySpendCeiling
                    or QuickScanGuardRejectionReason.ConcurrentScanLimit =>
                    controller.ServiceUnavailableProblem("Quick Scan has reached its demonstration capacity for today."),

                QuickScanGuardRejectionReason.SignInRequired =>
                    controller.StatusCode(
                        StatusCodes.Status403Forbidden,
                        new Microsoft.AspNetCore.Mvc.ProblemDetails
                        {
                            Title = "Sign-in required",
                            Detail = "Additional Quick Scan attempts require sign-in.",
                            Type = ProblemTypes.BusinessRuleViolation,
                            Status = StatusCodes.Status403Forbidden,
                        }),

                _ => controller.StatusCode(
                    StatusCodes.Status429TooManyRequests,
                    new Microsoft.AspNetCore.Mvc.ProblemDetails
                    {
                        Title = "Too many requests",
                        Detail = "Quick Scan is temporarily unavailable. Try again later or view the sample result.",
                        Type = ProblemTypes.LlmTokenQuotaExceeded,
                        Status = StatusCodes.Status429TooManyRequests,
                    }),
            };
        }

        if (result.FailureKind == QuickScanExecutionFailureKind.CapacityReached)
        {
            return controller.ServiceUnavailableProblem("Quick Scan has reached its demonstration capacity for today.");
        }

        return controller.ServiceUnavailableProblem(
            "Quick Scan could not be completed. View the sample result or try again later.");
    }

    private static IActionResult MapConcurrencyRejected(
        ControllerBase controller,
        QuickScanConcurrencyRejectionReason reason)
    {
        string errorCode = reason switch
        {
            QuickScanConcurrencyRejectionReason.QueueFull => QuickScanConcurrencyErrorCodes.QueueFull,
            QuickScanConcurrencyRejectionReason.QueueTimeout => QuickScanConcurrencyErrorCodes.QueueTimeout,
            _ => QuickScanConcurrencyErrorCodes.Busy,
        };

        string detail = reason switch
        {
            QuickScanConcurrencyRejectionReason.QueueFull =>
                "Quick Scan is at capacity. View the sample result or try again later.",
            QuickScanConcurrencyRejectionReason.QueueTimeout =>
                "Quick Scan timed out while waiting for capacity. View the sample result or try again later.",
            _ => "Quick Scan is busy. View the sample result or try again in a moment.",
        };

        return controller.ServiceUnavailableProblemWithErrorCode(detail, errorCode);
    }
}
