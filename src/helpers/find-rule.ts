import normalizeUrl from "./normalize-url";
import makeRules  from "./make-rules";
import { Rule } from "../types/rule";

export default (url: string, blocked: string[]): Rule => {
  const normalizedUrl = normalizeUrl(url);
  const rules = makeRules(blocked);
  const foundRule = rules.find((rule) => normalizedUrl.startsWith(rule.path) || normalizedUrl.endsWith(rule.path));
  return foundRule || {
    type: "warn",
    path: normalizeUrl(url),
  };
};
