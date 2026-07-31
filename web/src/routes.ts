export type AppRoute =
  | { type: "home" }
  | {
      type: "configure";
      companySlug: string;
      productCode: string;
      selectedOptionCodes: string[];
    }
  | { type: "configuration"; configurationCode: string }
  | { type: "notFound" };

export function parseRoute(location: Location): AppRoute {
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return { type: "home" };
  }

  if (segments.length === 3 && segments[0] === "configure") {
    return {
      type: "configure",
      companySlug: decodeURIComponent(segments[1]),
      productCode: decodeURIComponent(segments[2]),
      selectedOptionCodes: new URLSearchParams(location.search).getAll(
        "option",
      ),
    };
  }

  if (segments.length === 2 && segments[0] === "configurations") {
    return {
      type: "configuration",
      configurationCode: decodeURIComponent(segments[1]),
    };
  }

  return { type: "notFound" };
}
