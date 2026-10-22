using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;
namespace ArchLucid.Application.Integrations.Itsm;
public interface IItsmInboundStatusMapper {
  (string humanReview, bool mapped) MapToHumanReview(string statusValue, IntegrationsItsmInboundOptions options);
  FindingDisposition? TryMapToDisposition(string statusValue, IntegrationsItsmInboundOptions options);
}
