using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Http;

/// <summary>
///     Shared tenant + workspace existence checks for scope-bound API reads (parity with
///     <see cref="Controllers.Tenancy.TenantWorkspacesController" />).
/// </summary>
internal static class TenantWorkspaceScopePreflight
{
    internal static async Task<(IActionResult? Problem, ScopeContext Scope)> RequireTenantAndWorkspaceAsync(
        ControllerBase controller,
        IScopeContextProvider scopeProvider,
        ITenantRepository tenantRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(controller);
        ArgumentNullException.ThrowIfNull(scopeProvider);
        ArgumentNullException.ThrowIfNull(tenantRepository);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return (controller.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound), scope);

        bool workspaceExists =
            await WorkspaceExistsAsync(tenantRepository, scope.TenantId, scope.WorkspaceId, cancellationToken)
                .ConfigureAwait(false);

        if (!workspaceExists)
            return (controller.NotFoundProblem("Workspace was not found for this tenant.", ProblemTypes.ResourceNotFound), scope);

        return (null, scope);
    }

    private static async Task<bool> WorkspaceExistsAsync(
        ITenantRepository tenantRepository,
        object tenantId,
        object workspaceId,
        CancellationToken cancellationToken)
    {
        object repository = tenantRepository;
        Type repositoryType = repository.GetType();

        System.Reflection.MethodInfo? workspaceExistsMethod = repositoryType.GetMethod(
            "WorkspaceExistsAsync",
            new[] { tenantId.GetType(), workspaceId.GetType(), typeof(CancellationToken) });

        if (workspaceExistsMethod is not null)
            return await InvokeTaskOfBoolAsync(repository, workspaceExistsMethod, tenantId, workspaceId, cancellationToken)
                .ConfigureAwait(false);

        System.Reflection.MethodInfo? getWorkspaceByIdMethod = repositoryType.GetMethod(
            "GetWorkspaceByIdAsync",
            new[] { tenantId.GetType(), workspaceId.GetType(), typeof(CancellationToken) });

        if (getWorkspaceByIdMethod is not null)
            return await InvokeTaskOfNullableAsync(repository, getWorkspaceByIdMethod, tenantId, workspaceId, cancellationToken)
                .ConfigureAwait(false) is not null;

        IReadOnlyList<TenantWorkspaceListItem> workspaces =
            await tenantRepository.ListWorkspacesAsync((dynamic)tenantId, cancellationToken).ConfigureAwait(false);

        return workspaces.Any(workspace => Equals(workspace.WorkspaceId, workspaceId));
    }

    private static async Task<bool> InvokeTaskOfBoolAsync(
        object target,
        System.Reflection.MethodInfo method,
        object tenantId,
        object workspaceId,
        CancellationToken cancellationToken)
    {
        object? invocationResult = method.Invoke(target, new[] { tenantId, workspaceId, cancellationToken });

        if (invocationResult is Task<bool> boolTask)
            return await boolTask.ConfigureAwait(false);

        throw new InvalidOperationException($"Method '{method.Name}' must return Task<bool>.");
    }

    private static async Task<object?> InvokeTaskOfNullableAsync(
        object target,
        System.Reflection.MethodInfo method,
        object tenantId,
        object workspaceId,
        CancellationToken cancellationToken)
    {
        object? invocationResult = method.Invoke(target, new[] { tenantId, workspaceId, cancellationToken });

        if (invocationResult is null)
            throw new InvalidOperationException($"Method '{method.Name}' must return Task<T>.");

        if (invocationResult is not Task task)
            throw new InvalidOperationException($"Method '{method.Name}' must return Task<T>.");

        await task.ConfigureAwait(false);

        Type taskType = invocationResult.GetType();
        System.Reflection.PropertyInfo? resultProperty = taskType.GetProperty("Result");

        if (resultProperty is null)
            throw new InvalidOperationException($"Method '{method.Name}' must return Task<T>.");

        return resultProperty.GetValue(invocationResult);
    }
}
