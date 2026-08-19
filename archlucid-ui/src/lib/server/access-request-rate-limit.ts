import "server-only";

import type { NextRequest } from "next/server";

import { proxyRateLimitClientKey } from "@/lib/proxy-rate-limit";

type WindowEntry = {
  count: number;
  windowStartMs: number;
};

const ipBuckets = new Map<string, WindowEntry>();
const emailBuckets = new Map<string, WindowEntry>();

const IP_MAX_REQUESTS = 8;
const IP_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_MAX_REQUESTS = 2;
const EMAIL_WINDOW_MS = 24 * 60 * 60 * 1000;

export function resetAccessRequestRateLimitStateForTests(): void {
  ipBuckets.clear();
  emailBuckets.clear();
}

function isLimited(
  buckets: Map<string, WindowEntry>,
  key: string,
  maxRequests: number,
  windowMs: number,
  nowMs: number,
): boolean {
  const entry = buckets.get(key);

  if (!entry || nowMs - entry.windowStartMs >= windowMs) {
    buckets.set(key, { count: 1, windowStartMs: nowMs });
    return false;
  }

  if (entry.count < maxRequests) {
    entry.count++;
    return false;
  }

  return true;
}

export function isAccessRequestRateLimited(request: NextRequest, workEmail: string): boolean {
  const nowMs = Date.now();
  const ipKey = proxyRateLimitClientKey(request);
  const emailKey = workEmail.trim().toLowerCase();

  if (isLimited(ipBuckets, ipKey, IP_MAX_REQUESTS, IP_WINDOW_MS, nowMs)) {
    return true;
  }

  if (isLimited(emailBuckets, emailKey, EMAIL_MAX_REQUESTS, EMAIL_WINDOW_MS, nowMs)) {
    return true;
  }

  return false;
}
