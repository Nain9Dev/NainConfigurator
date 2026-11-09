import { describe, expect, it } from "vitest";

import html from "../index.html?raw";
import llmsTxt from "../public/llms.txt?raw";
import robotsTxt from "../public/robots.txt?raw";
import sitemapXml from "../public/sitemap.xml?raw";

const HOST_ROOT = "https://configurator.naindev.com/";
const AUTHOR_ID = "https://www.naindev.com/#person";

function metaContent(attribute: string, value: string): string[] {
  const pattern = new RegExp(
    `<meta\\s+${attribute}="${value}"\\s+content="([^"]*)"`,
    "gs",
  );
  return [...html.matchAll(pattern)].map((match) => match[1] ?? "");
}

describe("public page SEO baseline (REQ-CFG-011)", () => {
  it("has a single canonical URL equal to the host root", () => {
    const hrefs = [
      ...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]*)"/g),
    ];
    expect(hrefs.map((match) => match[1])).toEqual([HOST_ROOT]);
  });

  it("has one description between 70 and 160 characters", () => {
    const descriptions = metaContent("name", "description");
    expect(descriptions).toHaveLength(1);
    expect(descriptions[0]!.length).toBeGreaterThanOrEqual(70);
    expect(descriptions[0]!.length).toBeLessThanOrEqual(160);
  });

  it("declares Open Graph and Twitter card metadata", () => {
    expect(metaContent("property", "og:type")).toEqual(["website"]);
    expect(metaContent("property", "og:url")).toEqual([HOST_ROOT]);
    expect(metaContent("property", "og:site_name")).toEqual([
      "NainConfigurator",
    ]);
    const images = metaContent("property", "og:image");
    expect(images).toHaveLength(1);
    expect(images[0]).toMatch(/^https:\/\//);
    expect(metaContent("name", "twitter:card")).toEqual([
      "summary_large_image",
    ]);
    expect(metaContent("name", "twitter:image")).toEqual(images);
  });

  it("links the author", () => {
    expect(html).toContain(
      '<link rel="author" href="https://www.naindev.com/" />',
    );
  });

  it("embeds SoftwareApplication JSON-LD that names the author", () => {
    const blocks = [
      ...html.matchAll(
        /<script type="application\/ld\+json">(.*?)<\/script>/gs,
      ),
    ].map((match) => match[1] ?? "");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).not.toContain("<");
    const data = JSON.parse(blocks[0]!);
    expect(data["@type"]).toBe("SoftwareApplication");
    expect(data.url).toBe(HOST_ROOT);
    expect(data.operatingSystem).toBe("Web");
    expect(data.isAccessibleForFree).toBe(true);
    expect(data.author["@id"]).toBe(AUTHOR_ID);
  });

  it("publishes robots.txt that advertises the sitemap", () => {
    const lines = robotsTxt.split(/\r?\n/);
    expect(lines).toContain("User-agent: *");
    expect(lines).toContain("Allow: /");
    expect(lines).toContain(`Sitemap: ${HOST_ROOT}sitemap.xml`);
    expect(lines.some((line) => line.startsWith("Disallow: /"))).toBe(false);
  });

  it("lists the canonical root in sitemap.xml", () => {
    const locations = [...sitemapXml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(
      (match) => match[1],
    );
    expect(locations[0]).toBe(HOST_ROOT);
  });

  it("publishes llms.txt that starts with an H1", () => {
    const text = llmsTxt;
    expect(text.startsWith("# ")).toBe(true);
    expect(text).toContain("\n> ");
  });
});
