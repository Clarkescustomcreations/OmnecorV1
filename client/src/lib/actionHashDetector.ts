/**
 * Action Hash Loop Detector
 *
 * Prevents runaway token burn by detecting repetitive agent loops.
 * When 3 identical consecutive action hashes are detected, triggers
 * a human-in-the-loop (HITL) alert to pause execution.
 */

import crypto from "crypto";

export interface ActionRecord {
  hash: string;
  tool: string;
  args: Record<string, unknown>;
  state: Record<string, unknown>;
  timestamp: Date;
  sequenceNumber: number;
}

export interface LoopDetectionResult {
  isLoopDetected: boolean;
  consecutiveCount: number;
  lastHash: string | null;
  actionHistory: ActionRecord[];
  recommendation: string;
}

export interface HITLAlert {
  id: string;
  timestamp: Date;
  severity: "warning" | "critical";
  title: string;
  message: string;
  actionHistory: ActionRecord[];
  userActions: {
    retry: boolean;
    modify: boolean;
    abort: boolean;
  };
  resolved: boolean;
  userDecision?: "retry" | "modify" | "abort";
}

/**
 * Generate a hash for an action (tool + args + state)
 *
 * The hash is deterministic based on the action's tool, arguments, and current state.
 * This allows us to detect when the same action is being repeated.
 */
export function generateActionHash(
  tool: string,
  args: Record<string, unknown>,
  state: Record<string, unknown>
): string {
  const actionString = JSON.stringify({
    tool,
    args: sortObjectKeys(args),
    state: sortObjectKeys(state),
  });

  return crypto.createHash("sha256").update(actionString).digest("hex");
}

/**
 * Sort object keys recursively for consistent hashing
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);

  const sorted: Record<string, unknown> = {};
  Object.keys(obj as Record<string, unknown>)
    .sort()
    .forEach(key => {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
    });

  return sorted;
}

/**
 * Create an action record
 */
export function createActionRecord(
  tool: string,
  args: Record<string, unknown>,
  state: Record<string, unknown>,
  sequenceNumber: number
): ActionRecord {
  return {
    hash: generateActionHash(tool, args, state),
    tool,
    args,
    state,
    timestamp: new Date(),
    sequenceNumber,
  };
}

/**
 * Detect loops in action history
 *
 * Returns true if 3 or more identical consecutive hashes are found.
 * Threshold is 3 as specified in requirements.
 */
export function detectLoop(history: ActionRecord[]): LoopDetectionResult {
  const LOOP_THRESHOLD = 3;

  if (history.length === 0) {
    return {
      isLoopDetected: false,
      consecutiveCount: 0,
      lastHash: null,
      actionHistory: history,
      recommendation: "Monitoring for loops...",
    };
  }

  // Count consecutive identical hashes from the end
  let consecutiveCount = 1;
  const lastHash = history[history.length - 1].hash;

  for (let i = history.length - 2; i >= 0; i--) {
    if (history[i].hash === lastHash) {
      consecutiveCount++;
    } else {
      break;
    }
  }

  const isLoopDetected = consecutiveCount >= LOOP_THRESHOLD;

  if (isLoopDetected) {
    return {
      isLoopDetected: true,
      consecutiveCount,
      lastHash,
      actionHistory: history,
      recommendation:
        `Loop detected! The agent has repeated the same action ${consecutiveCount} times. Consider modifying the action parameters or aborting the operation.`,
    };
  }

  return {
    isLoopDetected: false,
    consecutiveCount,
    lastHash,
    actionHistory: history,
    recommendation:
      consecutiveCount >= 2
        ? "Warning: Repeated actions detected. Consider changing strategy."
        : "No loops detected.",
  };
}

/**
 * Create a HITL alert
 */
export function createHITLAlert(
  loopDetection: LoopDetectionResult,
  severity: "warning" | "critical" = "critical"
): HITLAlert {
  const repeatedAction =
    loopDetection.actionHistory[loopDetection.actionHistory.length - 1];

  return {
    id: `hitl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    severity,
    title: "Loop Detected - Human Review Required",
    message: `The agent has repeated the same action (${repeatedAction?.tool}) ${loopDetection.consecutiveCount} times consecutively. This may indicate a loop that will waste tokens. Please review and take action.`,
    actionHistory: loopDetection.actionHistory.slice(-5), // Last 5 actions for context
    userActions: {
      retry: true,
      modify: true,
      abort: true,
    },
    resolved: false,
  };
}

/**
 * Validate HITL alert resolution
 */
export function resolveHITLAlert(
  alert: HITLAlert,
  decision: "retry" | "modify" | "abort"
): HITLAlert {
  return {
    ...alert,
    resolved: true,
    userDecision: decision,
  };
}

/**
 * Format action for display
 */
export function formatActionForDisplay(action: ActionRecord): string {
  return `Tool: ${action.tool} | Hash: ${action.hash.substring(0, 8)}... | Time: ${action.timestamp.toLocaleTimeString()}`;
}

/**
 * Get loop detection statistics
 */
export function getLoopStatistics(history: ActionRecord[]): {
  totalActions: number;
  uniqueActions: number;
  mostRepeatedAction: { tool: string; count: number } | null;
  loopsDetected: number;
} {
  const uniqueHashes = new Set(history.map(r => r.hash)).size;

  // Find most repeated action
  const toolCounts: Record<string, number> = {};
  history.forEach(record => {
    toolCounts[record.tool] = (toolCounts[record.tool] || 0) + 1;
  });

  const mostRepeatedAction = Object.entries(toolCounts).reduce(
    (max, [tool, count]) => (count > (max?.count || 0) ? { tool, count } : max),
    null as { tool: string; count: number } | null
  );

  // Count loop occurrences
  let loopsDetected = 0;
  for (let i = 2; i < history.length; i++) {
    if (
      history[i].hash === history[i - 1].hash &&
      history[i - 1].hash === history[i - 2].hash
    ) {
      loopsDetected++;
    }
  }

  return {
    totalActions: history.length,
    uniqueActions: uniqueHashes,
    mostRepeatedAction,
    loopsDetected,
  };
}

/**
 * Mock action history for demo
 */
export const mockActionHistory: ActionRecord[] = [
  createActionRecord(
    "search",
    { query: "Omnecor AI workstation", limit: 10 },
    { context: "initial", conversationId: "conv_123" },
    1
  ),
  createActionRecord(
    "analyze",
    { data: "research findings", depth: "detailed" },
    { context: "initial", conversationId: "conv_123" },
    2
  ),
  createActionRecord(
    "generate",
    { prompt: "Create implementation plan", model: "gpt-4" },
    { context: "planning", conversationId: "conv_123" },
    3
  ),
  createActionRecord(
    "search",
    { query: "Omnecor AI workstation", limit: 10 },
    { context: "initial", conversationId: "conv_123" },
    4
  ),
  createActionRecord(
    "search",
    { query: "Omnecor AI workstation", limit: 10 },
    { context: "initial", conversationId: "conv_123" },
    5
  ),
  createActionRecord(
    "search",
    { query: "Omnecor AI workstation", limit: 10 },
    { context: "initial", conversationId: "conv_123" },
    6
  ),
];
