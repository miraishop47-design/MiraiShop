import { MetadataRoute } from 'next';
import { productService } from '../application/services/productService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://miraishop.vercel.app';

  // Get all active products
  const products = await productService.getProducts();
  const activeProducts = products.filter(p => p.activo !== false);

  const productUrls = activeProducts.map((product) => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: product.createdAt ? new Date(product.createdAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

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
