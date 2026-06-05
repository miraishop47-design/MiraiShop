import { MetadataRoute } from 'next';
import { productService } from '../application/services/productService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://miraishop.vercel.app';

  // Get all active products
  const products = await productService.getProducts();
  const activeProducts = products.filter(p => p.activo !== false);

  const productUrls = activeProducts.map((product) => {
    let lastModified = new Date();
    if (product.createdAt) {
      if (typeof product.createdAt === 'string' || typeof product.createdAt === 'number') {
        lastModified = new Date(product.createdAt);
      } else if (typeof (product.createdAt as any).toDate === 'function') {
        lastModified = (product.createdAt as any).toDate();
      }
      if (isNaN(lastModified.getTime())) {
        lastModified = new Date();
      }
    }

    return {
      url: `${baseUrl}/products/${product.id}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    };
  });

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/productos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...productUrls,
  ];
}
