import { describe, expect, it } from "vitest";

import { parseFilenameFromContentDisposition } from "./downloads-blob-trigger-browser";

describe("parseFilenameFromContentDisposition", () => {
  it("decodes an RFC 5987 filename* when no quoted filename is present", () => {
    const header = String.raw`attachment; filename*=UTF-8''report%20name.pdf`;

    expect(parseFilenameFromContentDisposition(header)).toBe("report name.pdf");
  });

  it("prefers a quoted filename when it appears before filename*", () => {
    const header = String.raw`attachment; filename="plain-name.pdf"; filename*=UTF-8''encoded%20name.pdf`;

    expect(parseFilenameFromContentDisposition(header)).toBe("plain-name.pdf");
  });
});