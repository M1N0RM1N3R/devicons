import {
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE_URL,
  SITE_AUTHOR,
  GITHUB_URL,
  TWITTER_HANDLE,
} from '../consts';

type JsonLd = Record<string, unknown>;

const abs = (path: string, base: string = SITE_URL) =>
  new URL(path, base).toString();

const twitterUrl = () =>
  TWITTER_HANDLE
    ? `https://twitter.com/${TWITTER_HANDLE.replace(/^@/, '')}`
    : undefined;

export const organizationSchema = (site: string = SITE_URL): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': abs('/#organization', site),
  name: SITE_TITLE,
  url: site,
  logo: {
    '@type': 'ImageObject',
    url: abs('/favicon.svg', site),
  },
  sameAs: [GITHUB_URL, twitterUrl()].filter(Boolean) as string[],
});

export const websiteSchema = (site: string = SITE_URL): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': abs('/#website', site),
  name: SITE_TITLE,
  description: SITE_DESCRIPTION,
  url: site,
  publisher: { '@id': abs('/#organization', site) },
  inLanguage: 'en-US',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: abs('/search?q={search_term_string}', site),
    },
    'query-input': 'required name=search_term_string',
  },
});

export const breadcrumbSchema = (
  items: Array<{ name: string; url?: string }>,
  site: string = SITE_URL,
): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    ...(item.url ? { item: abs(item.url, site) } : {}),
  })),
});

interface IconSchemaInput {
  name: string;
  description?: string;
  slug: string;
  website?: string;
  mainColor?: string;
  license?: string;
  site?: string;
}

export const iconBrandSchema = ({
  name,
  description,
  slug,
  website,
  site = SITE_URL,
}: IconSchemaInput): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Brand',
  '@id': abs(`/icons/${slug}#brand`, site),
  name,
  ...(description ? { description } : {}),
  url: abs(`/icons/${slug}`, site),
  logo: abs(`/devicons/icons/${slug}.svg`, site),
  ...(website ? { sameAs: [website] } : {}),
});

export const iconImageSchema = ({
  name,
  slug,
  license,
  site = SITE_URL,
}: IconSchemaInput): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'ImageObject',
  contentUrl: abs(`/devicons/icons/${slug}.svg`, site),
  url: abs(`/icons/${slug}`, site),
  name: `${name} logo`,
  encodingFormat: 'image/svg+xml',
  ...(license ? { license } : {}),
  creditText: name,
  creator: { '@id': abs('/#organization', site) },
});

interface TechArticleInput {
  title: string;
  description?: string;
  slug: string;
  publishedTime?: string;
  modifiedTime?: string;
  site?: string;
}

export const techArticleSchema = ({
  title,
  description,
  slug,
  publishedTime,
  modifiedTime,
  site = SITE_URL,
}: TechArticleInput): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: title,
  ...(description ? { description } : {}),
  mainEntityOfPage: abs(`/docs/${slug}`, site),
  inLanguage: 'en-US',
  author: {
    '@type': 'Organization',
    name: SITE_AUTHOR,
    '@id': abs('/#organization', site),
  },
  publisher: { '@id': abs('/#organization', site) },
  ...(publishedTime ? { datePublished: publishedTime } : {}),
  ...(modifiedTime ? { dateModified: modifiedTime } : {}),
});

interface CollectionPageInput {
  name: string;
  description: string;
  url: string;
  items: Array<{ name: string; url: string }>;
  site?: string;
}

export const collectionPageSchema = ({
  name,
  description,
  url,
  items,
  site = SITE_URL,
}: CollectionPageInput): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name,
  description,
  url: abs(url, site),
  inLanguage: 'en-US',
  isPartOf: { '@id': abs('/#website', site) },
  mainEntity: {
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: abs(item.url, site),
    })),
  },
});

export const softwareApplicationSchema = (site: string = SITE_URL): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_TITLE,
  description: SITE_DESCRIPTION,
  url: site,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: { '@id': abs('/#organization', site) },
  downloadUrl: GITHUB_URL,
});

export const faqSchema = (
  faqs: Array<{ question: string; answer: string }>,
): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});
