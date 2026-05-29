import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://miraishop.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/productos', '/products/*'],
      disallow: ['/admin/', '/auth/', '/cart/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
