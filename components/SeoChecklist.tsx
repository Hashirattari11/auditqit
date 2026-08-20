"use client";

interface SeoItem {
  label: string;
  pass: boolean;
  detail?: string;
}

export default function SeoChecklist({ seo }: { seo: Record<string, unknown> | unknown }) {
  if (!seo || typeof seo !== "object") {
    return <div className="text-dark-400 text-sm">No SEO data available</div>;
  }

  const data = seo as Record<string, Record<string, unknown>>;

  const items: SeoItem[] = [
    {
      label: "Title tag",
      pass: data.title?.present === true,
      detail: data.title?.present
        ? `${data.title.length} chars (${(data.title as Record<string, unknown>).ideal ? "ideal" : "non-ideal length"})`
        : "Missing",
    },
    {
      label: "Meta description",
      pass: data.metaDescription?.present === true,
      detail: data.metaDescription?.present
        ? `${(data.metaDescription as Record<string, unknown>).length} chars`
        : "Missing",
    },
    {
      label: "H1 tag",
      pass: data.h1?.present === true && (data.h1?.count as number) === 1,
      detail: data.h1?.present
        ? `${data.h1.count} H1 tag${(data.h1.count as number) !== 1 ? "s" : ""}`
        : "Missing",
    },
    {
      label: "Images have alt text",
      pass:
        data.imagesWithoutAlt &&
        typeof data.imagesWithoutAlt === "object" &&
        (data.imagesWithoutAlt as Record<string, unknown>).withoutAlt === 0,
      detail: data.imagesWithoutAlt
        ? `${(data.imagesWithoutAlt as Record<string, unknown>).withoutAlt} of ${(data.imagesWithoutAlt as Record<string, unknown>).total} missing`
        : "N/A",
    },
    {
      label: "Canonical tag",
      pass: data.canonical?.present === true,
      detail: data.canonical?.present ? "Present" : "Missing",
    },
    {
      label: "robots.txt",
      pass: data.robotsTxt?.exists === true,
      detail: data.robotsTxt?.exists ? "Exists" : "Not found",
    },
    {
      label: "sitemap.xml",
      pass: data.sitemapXml?.exists === true,
      detail: data.sitemapXml?.exists
        ? `${(data.sitemapXml as Record<string, unknown>).urlCount} URLs`
        : "Not found",
    },
    {
      label: "Open Graph tags",
      pass: data.openGraph?.title != null && data.openGraph?.description != null,
      detail: data.openGraph?.title ? "Present" : "Missing",
    },
  ];

  const passCount = items.filter((i) => i.pass).length;

  return (
    <div>
      <div className="mb-3 text-sm text-dark-400">
        {passCount}/{items.length} checks passed
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-dark-800/50"
          >
            <span
              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                item.pass
                  ? "bg-green-500/20 text-accent-green"
                  : "bg-red-500/20 text-accent-red"
              }`}
            >
              {item.pass ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </span>
            <span className="text-sm text-dark-200 flex-1">{item.label}</span>
            <span className="text-xs text-dark-400">{item.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
