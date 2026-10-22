/**
 * When Content-Length is present and parseable, reject before buffering if it exceeds the cap.
 * Returns `false` when absent, invalid, or within limit (caller should stream-read with a limit).
 */
export function declaredPostBodyExceedsLimit(
  contentLengthHeader: string | null,
  maxBytes: number,
): false | { declaredLength: number } {
  if (contentLengthHeader === null || contentLengthHeader.trim() === "") {
    return false;
  }

  const declaredLength = Number(contentLengthHeader);

  if (Number.isNaN(declaredLength)) {
    return false;
  }

  if (declaredLength > maxBytes) {
    return { declaredLength };
  }

  return false;
}

/**
 * Reads a request body stream as raw bytes, enforcing a maximum byte size.
 * Prefer this for proxy forwards so multipart/binary uploads are not UTF-8 mangled.
 *
 * @returns Joined bytes, empty {@link Uint8Array} when {@link body} is null/undefined, or `null` if over limit.
 */
export async function readRequestBodyBytesWithLimit(
  body: ReadableStream<Uint8Array> | null | undefined,
  maxBytes: number,
): Promise<Uint8Array | null> {
  if (body == null) {
    return new Uint8Array(0);
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (totalBytes > maxBytes) {
      await reader.cancel();
      return null;
    }

    chunks.push(value);
  }

  const joined = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return joined;
}

/**
 * Reads a request body stream as UTF-8 text, enforcing a maximum byte size.
 *
 * @returns Joined text, `""` when {@link body} is null/undefined, or `null` if the limit is exceeded.
 */
export async function readRequestBodyWithLimit(
  body: ReadableStream<Uint8Array> | null | undefined,
  maxBytes: number,
): Promise<string | null> {
  const bytes = await readRequestBodyBytesWithLimit(body, maxBytes);

  if (bytes === null) {
    return null;
  }

  if (bytes.byteLength === 0) {
    return "";
  }

  return new TextDecoder().decode(bytes);
}
