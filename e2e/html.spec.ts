import { expect, test } from "@playwright/test";
import { HtmlValidate } from "html-validate";
import ROUTES from "./routes.json";

/**
 * HTML conformance: is the markup the server sends valid per the WHATWG HTML
 * standard? `html-validate:standard` is the standard-only preset — content
 * model, permitted parents, duplicate ids, required attributes. It carries no
 * style opinions and no accessibility rules (axe owns those).
 *
 * This reads the server response, not the hydrated DOM: a browser silently
 * repairs invalid nesting while parsing, which is exactly what hides it.
 */
const validator = new HtmlValidate({ extends: ["html-validate:standard"] });

for (const route of ROUTES) {
  test(`html ${route}`, async ({ request }) => {
    const html = await (await request.get(route)).text();
    const report = await validator.validateString(html);
    const messages = report.results.flatMap((r) =>
      r.messages.map((m) => `${m.ruleId} (${m.line}:${m.column}) ${m.message}`),
    );
    expect(messages, messages.join("\n")).toEqual([]);
  });
}
