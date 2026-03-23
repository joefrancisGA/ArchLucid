using ArchiForge.Api.Auth.Models;
using ArchiForge.Core.Scoping;
using ArchiForge.Persistence.Conversation;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchiForge.Api.Controllers;

[ApiController]
[Authorize(Policy = ArchiForgePolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("api/conversations")]
[EnableRateLimiting("fixed")]
public sealed class ConversationController(
    IConversationThreadRepository threadRepository,
    IConversationMessageRepository messageRepository,
    IScopeContextProvider scopeProvider)
    : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ListThreads(int take = 50, CancellationToken ct = default)
    {
        var scope = scopeProvider.GetCurrentScope();

        var threads = await threadRepository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            take,
            ct);

        return Ok(threads);
    }

    [HttpGet("{threadId:guid}/messages")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMessages(Guid threadId, int take = 100, CancellationToken ct = default)
    {
        var scope = scopeProvider.GetCurrentScope();
        var thread = await threadRepository.GetByIdAsync(threadId, ct);
        if (thread is null ||
            thread.TenantId != scope.TenantId ||
            thread.WorkspaceId != scope.WorkspaceId ||
            thread.ProjectId != scope.ProjectId)
        {
            return NotFound();
        }

        var messages = await messageRepository.GetByThreadIdAsync(threadId, take, ct);
        return Ok(messages);
    }
}
