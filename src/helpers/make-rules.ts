import { Rule, RuleType } from "../types/rule";
import normalizeUrl from "./normalize-url";

export default (blocked: string[]): Rule[] => {
  const allowList = blocked
    .filter((item) => item.startsWith("!"))
    .map((item) => normalizeUrl(item.substring(1)));

  const blockList = blocked
    .filter((item) => !item.startsWith("!"))
    .map(normalizeUrl);

  const rules = [
    ...allowList.map((path) => ({ path, type: "allow" as RuleType })),
    ...blockList.map((path) => ({ path, type: "block" as RuleType })),
  ].sort((a, b) => b.path.length - a.path.length); // order the rules by their specificity; the longer the rule, the more specific

  return rules;
};
