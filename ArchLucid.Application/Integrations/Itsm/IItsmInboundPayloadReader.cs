using System.Text.Json;
namespace ArchLucid.Application.Integrations.Itsm;
public interface IItsmInboundPayloadReader { bool TryRead(JsonElement root, out ItsmInboundPayloadReadResult result); }
