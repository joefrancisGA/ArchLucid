using ArchLucid.Application;
using ArchLucid.Host.Core.ProblemDetails;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.ProblemDetails;

/// <summary>
///     The catch ladder shared by authority endpoints that accept work against an existing run: a missing run
///     becomes 404, a state conflict 409, bad input 400.
/// </summary>
/// <remarks>
///     <para>
///         Split into <see cref="CanMap" /> and <see cref="Map" /> so a call site can use it as an exception filter
///         without an <c>out</c> parameter:
///         <c>catch (Exception ex) when (AuthorityRunProblemLadder.CanMap(ex)) { return AuthorityRunProblemLadder.Map(this, ex); }</c>
///     </para>
///     <para>
///         Arm order matters. <see cref="ConflictException" /> derives from <see cref="InvalidOperationException" />,
///         so the conflict arm must precede the invalid-operation arm or every 409 would be answered as a 400.
///     </para>
/// </remarks>
public static class AuthorityRunProblemLadder
{
    /// <summary>True when <paramref name="exception" /> is one of the exceptions this ladder answers.</summary>
    public static bool CanMap(Exception? exception) =>
        exception is RunNotFoundException or ArgumentException or InvalidOperationException;

    /// <summary>
    ///     Maps a ladder exception to its problem response. Call only where <see cref="CanMap" /> returned true.
    /// </summary>
    /// <exception cref="ArgumentException">
    ///     <paramref name="exception" /> is outside the ladder, which means a call site tested a different condition
    ///     than the one this ladder answers.
    /// </exception>
    public static IActionResult Map(ControllerBase controller, Exception exception)
    {
        ArgumentNullException.ThrowIfNull(controller);
        ArgumentNullException.ThrowIfNull(exception);

        return exception switch
        {
            RunNotFoundException runNotFound =>
                controller.NotFoundProblem(runNotFound.Message, ProblemTypes.RunNotFound),
            ConflictException conflict =>
                controller.ConflictProblem(conflict.Message, ProblemTypes.Conflict),
            ArgumentException invalidArgument =>
                controller.BadRequestProblem(invalidArgument.Message, ProblemTypes.ValidationFailed),
            InvalidOperationException invalidOperation =>
                controller.InvalidOperationProblem(invalidOperation, ProblemTypes.BadRequest),
            _ => throw new ArgumentException(
                $"'{exception.GetType().Name}' is not an authority run ladder exception.",
                nameof(exception))
        };
    }
}
