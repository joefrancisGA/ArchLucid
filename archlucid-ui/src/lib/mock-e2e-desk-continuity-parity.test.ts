import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mock E2E desk-continuity route parity", () => {
  it("acknowledges PUT desk-continuity with 204 before rejecting unsupported writes", () => {
    const mockSource = readFileSync(
      join(process.cwd(), "e2e", "mock-archlucid-api-server.ts"),
      "utf8",
    );
    const route = 'if (req.method === "PUT" && pathname === "/v1/user/preferences/desk-continuity")';
    const routePosition = mockSource.indexOf(route);
    const unsupportedWritePosition = mockSource.indexOf('if (req.method !== "GET")');
    expect(routePosition).toBeGreaterThanOrEqual(0);
    expect(unsupportedWritePosition).toBeGreaterThan(routePosition);
    const routeBody = mockSource.slice(routePosition, unsupportedWritePosition);
    expect(routeBody).toContain("res.writeHead(204)");
    expect(routeBody).toContain("res.end()");
    expect(routeBody).toContain("return;");
  });

  it("agrees with the production controller's documented desk-continuity response", () => {
    const controller = readFileSync(
      join(process.cwd(), "..", "ArchLucid.Api", "Controllers", "User", "UserPreferencesController.NotificationPrefs.cs"),
      "utf8",
    );
    expect(controller).toContain('[HttpPut("desk-continuity")]');
    const methodSection = controller.split('[HttpPut("desk-continuity")]')[1]?.split('[HttpPut("working-workspace-continuity")]')[0];
    expect(methodSection).toContain("[ProducesResponseType(StatusCodes.Status204NoContent)]");
    expect(methodSection).toContain("return NoContent();");
  });
});
