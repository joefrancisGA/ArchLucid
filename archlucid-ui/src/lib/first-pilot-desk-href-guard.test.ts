import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const PEER_REVIEW_HREF = "`/architecture/reviews/${";

describe("first-pilot desk href guard", () => {
  it("does not embed peer review template literals in first-pilot lib modules", () => {
    const libDir = join(process.cwd(), "src", "lib");
    const offenders: string[] = [];

    for (const name of readdirSync(libDir)) {
      if (!name.startsWith("first-pilot") || !name.endsWith(".ts")) {
        continue;
      }

      if (name.includes(".test.")) {
        continue;
      }

      const body = readFileSync(join(libDir, name), "utf8");

      if (body.includes(PEER_REVIEW_HREF)) {
        offenders.push(`lib/${name}`);
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
