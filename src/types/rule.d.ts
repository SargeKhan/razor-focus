export type RuleType = "allow" | "block" | "warn"

export interface Rule {
  path: string
  type: RuleType
}