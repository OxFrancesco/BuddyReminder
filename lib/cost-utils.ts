// Cost calculation utilities for agent runs

// Daytona pricing (example rates - adjust based on actual pricing)
const DAYTONA_COST_PER_MINUTE = 0.5; // cents per minute

/**
 * Calculate sandbox runtime cost based on duration
 */
export function calculateSandboxCost(startedAt: number, endedAt: number): number {
  const durationMs = endedAt - startedAt;
  const durationMinutes = Math.ceil(durationMs / 60000);
  return durationMinutes * DAYTONA_COST_PER_MINUTE;
}

/**
 * Calculate total cost for an agent run
 */
export function calculateTotalCost(sandboxCost: number, llmTokenCost?: number): number {
  return sandboxCost + (llmTokenCost || 0);
}

/**
 * Format cost in cents to display string
 */
export function formatCost(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Get cumulative cost for a user across all runs
 */
export function getCumulativeCost(runs: Array<{ cost?: { total: number } }>): number {
  return runs.reduce((sum, run) => sum + (run.cost?.total || 0), 0);
}

/**
 * Check if user is approaching budget limit
 */
export function checkBudgetWarning(
  cumulativeCost: number,
  monthlyBudget: number
): { warning: boolean; percentage: number } {
  const percentage = (cumulativeCost / monthlyBudget) * 100;
  return {
    warning: percentage >= 80,
    percentage,
  };
}
