import { useEffect } from 'react';

interface SeoProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
}

const SITE_NAME = 'Blogger';
const BASE_URL = import.meta.env.VITE_SITE_URL || '';

export default function Seo({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage,
}: SeoProps) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const desc = description || 'Personal blog — tulisan, catatan, dan pemikiran.';
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : undefined;
  const ogImageUrl = ogImage ? `${BASE_URL}${ogImage}` : undefined;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const removeMeta = (name: string, attr: 'name' | 'property' = 'name') => {
      const el = document.querySelector(`meta[${attr}="${name}"]`);
      if (el) el.remove();
    };

    setMeta('description', desc);

    // Open Graph
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:type', ogType, 'property');
    if (canonicalUrl) setMeta('og:url', canonicalUrl, 'property');
    else removeMeta('og:url', 'property');
    if (ogImageUrl) setMeta('og:image', ogImageUrl, 'property');
    else removeMeta('og:image', 'property');

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', desc);
    if (ogImageUrl) setMeta('twitter:image', ogImageUrl);
    else removeMeta('twitter:image');

    // Canonical link
    let linkEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonicalUrl) {
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.rel = 'canonical';
        document.head.appendChild(linkEl);
      }
      linkEl.href = canonicalUrl;
    } else if (linkEl) {
      linkEl.remove();
    }
  }, [fullTitle, desc, canonicalUrl, ogType, ogImageUrl]);

  return null;
}