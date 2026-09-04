using System.Text.Json;

using ArchLucid.Application.Value;
using ArchLucid.ArtifactSynthesis.Docx;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.ValueReports;

public sealed partial class InMemoryValueReportJobQueue
{
    [InformationalAudit]
    private async Task RunJobAsync(Guid jobId, ValueReportJobRequest request)
    {
        try
        {
            await using AsyncServiceScope scope = _scopeFactory.CreateAsyncScope();

            using (AmbientScopeContext.Push(
                       new ScopeContext
                       {
                           TenantId = request.TenantId,
                           WorkspaceId = request.WorkspaceId,
                           ProjectId = request.ProjectId
                       }))
            {
                ValueReportBuilder builder = scope.ServiceProvider.GetRequiredService<ValueReportBuilder>();
                IValueReportRenderer renderer = scope.ServiceProvider.GetRequiredService<IValueReportRenderer>();
                IAuditService audit = scope.ServiceProvider.GetRequiredService<IAuditService>();

                ValueReportSnapshot snapshot = await builder.BuildAsync(
                    request.TenantId,
                    request.WorkspaceId,
                    request.ProjectId,
                    request.FromUtcInclusive,
                    request.ToUtcExclusive,
                    CancellationToken.None);

                byte[] docx = await renderer.RenderAsync(snapshot, CancellationToken.None);

                string fileName =
                    $"ArchLucid-value-report-{request.TenantId:N}-{request.FromUtcInclusive:yyyyMMdd}-{request.ToUtcExclusive:yyyyMMdd}.docx";

                await audit.LogAsync(
                    new AuditEvent
                    {
                        EventType = AuditEventTypes.ValueReportGenerated,
                        DataJson = JsonSerializer.Serialize(
                            new
                            {
                                jobId,
                                byteCount = docx.Length,
                                asyncJob = true
                            })
                    },
                    CancellationToken.None);

                JobEntry completed = new(request, JobPhase.Completed, docx, fileName, null);
                _jobs[jobId] = completed;
                WriteDistributedState(jobId, completed);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Value report job {JobId} failed.", jobId);
            _jobs.TryGetValue(jobId, out JobEntry? existing);
            ValueReportJobRequest req = existing?.Request ?? request;
            JobEntry failed = new(req, JobPhase.Failed, null, null, ex.Message);
            _jobs[jobId] = failed;
            WriteDistributedState(jobId, failed);
        }
    }
}
