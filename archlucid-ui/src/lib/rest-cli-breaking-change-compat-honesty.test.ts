import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

/** TB-1560: repo guard that REST+CLI compatibility copy stays honest after TB-1559. */
describe("rest+cli breaking-change compatibility honesty guard (TB-1560)", () => {
  it("documents the python compatibility honesty guard in the engineering contract", () => {
    const contract = readFileSync(
      join(REPO_ROOT, "docs/library/REST_CLI_BREAKING_CHANGE_COMPATIBILITY_CLAIM_MAP.md"),
      "utf8",
    );

    expect(contract).toContain("check_rest_cli_breaking_change_compat_honesty.py");
    expect(contract).toContain("**TB-1560**");
    expect(contract).toContain("OpenApiContractSnapshotTests");
  });

  it("keeps buyer packet M-288 section honest about snapshot vs semver", () => {
    const packet = readFileSync(
      join(REPO_ROOT, "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
      "utf8",
    );

    expect(packet).toContain("rest-cli-breaking-change-compatibility-m-289");
    expect(packet).toContain("TB-1560");
    expect(packet).toContain("OpenAPI snapshot equality");
  });
});
