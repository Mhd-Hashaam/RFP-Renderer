/**
 * Optional future hook: measure rendered layout units in the DOM and refine
 * pagination. Intentionally empty in v1 — heights are estimated in
 * `estimateHeight.ts` for deterministic, testable layout.
 */
export function measureHeightsNotImplemented(): void {
  // Reserved for a measurement-driven refinement pass.
}
