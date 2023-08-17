import { Rule } from "../../types/rule";
import makeRules  from "../make-rules";

test("makeRules()", () => {
  expect(
    makeRules([
      "youtube.com",
      "!music.youtube.com",
    ])
  ).toEqual<Rule[]>([
    {
      path: "music.youtube.com",
      type: "allow"
    },
    {
      path: "youtube.com",
      type: "block",
    },
  ]);
});
