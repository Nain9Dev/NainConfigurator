import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Vitest runs from `web/`, the directory that holds `package.json`.
const html = readFileSync(resolve("index.html"), "utf8");

// SPEC-004: the entry page carries its meaning in the HTML that crawlers receive
// before any script runs. Crawlers that do not execute JavaScript (several search
// engines and AI answer engines) otherwise see an empty page.
describe("index.html", () => {
  it("embeds valid SoftwareApplication JSON-LD (REQ-S-004)", () => {
    const match = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    );
    expect(match).not.toBeNull();
    const data = JSON.parse(match[1]);
    expect(data["@type"]).toBe("SoftwareApplication");
    expect(data.url).toBe("https://configurator.naindev.com/");
    expect(data.applicationCategory).toBe("BusinessApplication");
  });

  it("has a static fallback with one h1 and the page description (REQ-S-005)", () => {
    const match = html.match(/<noscript>([\s\S]*?)<\/noscript>/);
    expect(match).not.toBeNull();
    const squash = (text) => text.replace(/\s+/g, " ");
    const fallback = squash(match[1]);
    expect(fallback.match(/<h1[\s>]/g)).toHaveLength(1);
    const description = html.match(/name="description"\s+content="([^"]+)"/)[1];
    expect(fallback).toContain(squash(description));
    expect(fallback).toContain("https://github.com/Nain9Dev/NainConfigurator");
  });

  it("keeps the canonical URL (REQ-S-006)", () => {
    expect(html).toContain(
      '<link rel="canonical" href="https://configurator.naindev.com/" />',
    );
  });
});
