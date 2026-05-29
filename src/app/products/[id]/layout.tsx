import { Metadata, ResolvingMetadata } from 'next';
import { productService } from '../../../application/services/productService';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  
  if (!id) {
    return {
      title: 'Producto no encontrado | MiraiShop',
    };
  }

  // Fetch data
  const product = await productService.getProductById(id);

  if (!product) {
    return {
      title: 'Producto no encontrado | MiraiShop',
      description: 'El producto que buscas no existe o ha sido retirado.',
    };
  }

  // Optionally access and extend (rather than replace) parent metadata
  const previousImages = (await parent).openGraph?.images || [];

  const mainImage = product.imagenes && product.imagenes.length > 0 
    ? product.imagenes[0] 
    : (product.imagen || '');

  return {
    title: product.nombre,
    description: product.descripcion,
    openGraph: {
      title: product.nombre,
      description: product.descripcion,
      url: `/products/${id}`,
      images: mainImage ? [mainImage, ...previousImages] : previousImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.nombre,
      description: product.descripcion,
      images: mainImage ? [mainImage] : [],
    },
  };
}

export default function ProductDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
