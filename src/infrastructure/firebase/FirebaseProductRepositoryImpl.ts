import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { Product } from '../../domain/entities/Product';
import { db, isMockFirebase } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  getDoc,
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    nombre: 'Teclado Mecánico RGB Pro',
    precioMayorista: 69.99,
    stock: 50,
    descripcion: 'Teclado mecánico con switches red, switches intercambiables y retroiluminación RGB de alta intensidad.',
    categoria: 'Periféricos',
    imagen: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=500',
    imagenes: ['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=500'],
    activo: true,
    createdAt: new Date().toISOString(),
    isPackageSale: true,
    unitsPerPackage: 10,
    availablePackages: 15,
    precioPaquete: 500.00,
    packageOptions: [
      {
        id: 'pack-1a',
        unitsPerPackage: 6,
        availablePackages: 20,
        wholesalePrice: 320.00
      },
      {
        id: 'pack-1b',
        unitsPerPackage: 12,
        availablePackages: 10,
        wholesalePrice: 600.00
      }
    ]
  },
  {
    id: 'prod-2',
    nombre: 'Ratón Gamer Inalámbrico Stealth',
    precioMayorista: 45.99,
    stock: 35,
    descripcion: 'Ratón ergonómico inalámbrico con sensor óptico de 16,000 DPI y batería de larga duración.',
    categoria: 'Periféricos',
    imagen: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=500',
    imagenes: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=500'],
    activo: true,
    createdAt: new Date().toISOString(),
    isPackageSale: false
  },
  {
    id: 'prod-3',
    nombre: 'Monitor Gaming 27" QHD 165Hz',
    precioMayorista: 249.99,
    stock: 15,
    descripcion: 'Monitor para juegos de 27 pulgadas, resolución QHD (2560x1440), panel IPS y tiempo de respuesta de 1ms.',
    categoria: 'Monitores',
    imagen: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=500',
    imagenes: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=500'],
    activo: true,
    createdAt: new Date().toISOString(),
    isPackageSale: false
  },
  {
    id: 'prod-4',
    nombre: 'Auriculares Premium Hi-Fi ANC',
    precioMayorista: 119.99,
    stock: 25,
    descripcion: 'Auriculares de diadema con cancelación activa de ruido, audio espacial y almohadillas de espuma de memoria ultra cómodas.',
    categoria: 'Audio',
    imagen: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=500',
    imagenes: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=500'],
    activo: true,
    createdAt: new Date().toISOString(),
    isPackageSale: false
  }
];

export class FirebaseProductRepositoryImpl implements ProductRepository {
  private collectionRef = collection(db, 'productos');

  private getMockProducts(): Product[] {
    if (typeof window === 'undefined') return SEED_PRODUCTS;
    const stored = localStorage.getItem('mock_products');
    if (!stored) {
      localStorage.setItem('mock_products', JSON.stringify(SEED_PRODUCTS));
      return SEED_PRODUCTS;
    }
    try {
      return JSON.parse(stored);
    } catch (e) {
      return SEED_PRODUCTS;
    }
  }

  private sanitizeProductForRole(product: Product): Product {
    if (typeof window === 'undefined') return product;
    const role = localStorage.getItem('user_role');
    const isReseller = role === 'reseller' || role === 'admin';
    if (!isReseller) {
      return {
        ...product,
        precioCliente: undefined,
        precioMayorista: 0,
        precioPaquete: undefined,
        packageOptions: product.packageOptions ? product.packageOptions.map(opt => ({
          ...opt,
          wholesalePrice: 0
        })) : undefined
      };
    }
    return product;
  }

  private saveMockProducts(products: Product[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mock_products', JSON.stringify(products));
    window.dispatchEvent(new Event('mock_products_changed'));
  }

  async create(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    if (isMockFirebase) {
      console.log('[MiraiShop]\nSaving Product...\nRepository: LocalStorage');
      const products = this.getMockProducts();
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        ...product,
        createdAt: new Date().toISOString(),
      };
      products.unshift(newProduct);
      this.saveMockProducts(products);
      return newProduct;
    }

    console.log('[MiraiShop]\nSaving Product...\nRepository: Firestore');
    const cleanProduct = Object.fromEntries(
      Object.entries(product).filter(([_, v]) => v !== undefined)
    );

    const docRef = await addDoc(this.collectionRef, {
      ...cleanProduct,
      createdAt: serverTimestamp()
    });
    return {
      id: docRef.id,
      ...product,
    };
  }

  async getAll(): Promise<Product[]> {
    if (isMockFirebase) {
      const products = this.getMockProducts().map(p => this.sanitizeProductForRole(p));
      console.log(`[MiraiShop]\nData Source: localStorage/Mock\nProducts Loaded: ${products.length}`);
      return products;
    }

    const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    console.log(`[MiraiShop]\nCollection: productos\nFirestore Documents: ${querySnapshot.size}`);
    const docIds = querySnapshot.docs.map(d => d.id).join(', ');
    console.log(`[MiraiShop]\nDocuments Found: ${querySnapshot.size}\nIDs: ${docIds}`);
    const products: Product[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const p: Product = {
        id: docSnap.id,
        nombre: data.nombre,
        precioCliente: data.precioCliente !== undefined ? Number(data.precioCliente) : undefined,
        precioMayorista: Number(data.precioMayorista !== undefined ? data.precioMayorista : (data.precio || 0)),
        stock: Number(data.stock),
        descripcion: data.descripcion,
        categoria: data.categoria,
        imagen: data.imagen || (data.imagenes && data.imagenes[0]) || '',
        imagenes: data.imagenes || (data.imagen ? [data.imagen] : []),
        activo: data.activo !== undefined ? data.activo : true,
        createdAt: data.createdAt,
        isPackageSale: data.isPackageSale !== undefined ? data.isPackageSale : false,
        unitsPerPackage: data.unitsPerPackage !== undefined ? Number(data.unitsPerPackage) : undefined,
        availablePackages: data.availablePackages !== undefined ? Number(data.availablePackages) : undefined,
        precioPaquete: data.precioPaquete !== undefined ? Number(data.precioPaquete) : undefined,
        packageOptions: data.packageOptions ? (data.packageOptions as any[]).map(opt => ({
          id: String(opt.id),
          unitsPerPackage: Number(opt.unitsPerPackage),
          availablePackages: Number(opt.availablePackages),
          wholesalePrice: Number(opt.wholesalePrice || opt.precioPaquete || 0)
        })) : undefined,
        isMadeToOrder: data.isMadeToOrder !== undefined ? data.isMadeToOrder : false,
      };
      products.push(this.sanitizeProductForRole(p));
    });
    console.log(`[MiraiShop]\nData Source: Firestore\nProducts Loaded: ${products.length}`);
    return products;
  }

  async getById(id: string): Promise<Product | null> {
    if (isMockFirebase) {
      const products = this.getMockProducts();
      const p = products.find(p => p.id === id) || null;
      return p ? this.sanitizeProductForRole(p) : null;
    }

    const docRef = doc(db, 'productos', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    const data = docSnap.data();
    const p: Product = {
      id: docSnap.id,
      nombre: data.nombre,
      precioCliente: data.precioCliente !== undefined ? Number(data.precioCliente) : undefined,
      precioMayorista: Number(data.precioMayorista !== undefined ? data.precioMayorista : (data.precio || 0)),
      stock: Number(data.stock),
      descripcion: data.descripcion,
      categoria: data.categoria,
      imagen: data.imagen || (data.imagenes && data.imagenes[0]) || '',
      imagenes: data.imagenes || (data.imagen ? [data.imagen] : []),
      activo: data.activo !== undefined ? data.activo : true,
      createdAt: data.createdAt,
      isPackageSale: data.isPackageSale !== undefined ? data.isPackageSale : false,
      unitsPerPackage: data.unitsPerPackage !== undefined ? Number(data.unitsPerPackage) : undefined,
      availablePackages: data.availablePackages !== undefined ? Number(data.availablePackages) : undefined,
      precioPaquete: data.precioPaquete !== undefined ? Number(data.precioPaquete) : undefined,
      packageOptions: data.packageOptions ? (data.packageOptions as any[]).map(opt => ({
        id: String(opt.id),
        unitsPerPackage: Number(opt.unitsPerPackage),
        availablePackages: Number(opt.availablePackages),
        wholesalePrice: Number(opt.wholesalePrice || opt.precioPaquete || 0)
      })) : undefined,
      isMadeToOrder: data.isMadeToOrder !== undefined ? data.isMadeToOrder : false,
    };
    return this.sanitizeProductForRole(p);
  }

  subscribeToAll(callback: (products: Product[]) => void, onError?: (error: any) => void): () => void {
    if (isMockFirebase) {
      // Send initial data
      const initialProducts = this.getMockProducts().map(p => this.sanitizeProductForRole(p));
      console.log(`[MiraiShop]\nData Source: localStorage/Mock\nProducts Loaded: ${initialProducts.length}`);
      callback(initialProducts);
      const handler = () => {
        const products = this.getMockProducts().map(p => this.sanitizeProductForRole(p));
        console.log(`[MiraiShop]\nData Source: localStorage/Mock\nProducts Loaded: ${products.length}`);
        callback(products);
      };
      window.addEventListener('mock_products_changed', handler);
      return () => {
        window.removeEventListener('mock_products_changed', handler);
      };
    }

    const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      console.log(`[MiraiShop]\nCollection: productos\nFirestore Documents: ${querySnapshot.size}`);
      const docIds = querySnapshot.docs.map(d => d.id).join(', ');
      console.log(`[MiraiShop]\nDocuments Found: ${querySnapshot.size}\nIDs: ${docIds}`);
      const products: Product[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const p: Product = {
          id: docSnap.id,
          nombre: data.nombre,
          precioCliente: data.precioCliente !== undefined ? Number(data.precioCliente) : undefined,
          precioMayorista: Number(data.precioMayorista !== undefined ? data.precioMayorista : (data.precio || 0)),
          stock: Number(data.stock),
          descripcion: data.descripcion,
          categoria: data.categoria,
          imagen: data.imagen || (data.imagenes && data.imagenes[0]) || '',
          imagenes: data.imagenes || (data.imagen ? [data.imagen] : []),
          activo: data.activo !== undefined ? data.activo : true,
          createdAt: data.createdAt,
          isPackageSale: data.isPackageSale !== undefined ? data.isPackageSale : false,
          unitsPerPackage: data.unitsPerPackage !== undefined ? Number(data.unitsPerPackage) : undefined,
          availablePackages: data.availablePackages !== undefined ? Number(data.availablePackages) : undefined,
          precioPaquete: data.precioPaquete !== undefined ? Number(data.precioPaquete) : undefined,
          packageOptions: data.packageOptions ? (data.packageOptions as any[]).map(opt => ({
            id: String(opt.id),
            unitsPerPackage: Number(opt.unitsPerPackage),
            availablePackages: Number(opt.availablePackages),
            wholesalePrice: Number(opt.wholesalePrice || opt.precioPaquete || 0)
          })) : undefined,
          isMadeToOrder: data.isMadeToOrder !== undefined ? data.isMadeToOrder : false,
        };
        products.push(this.sanitizeProductForRole(p));
      });
      console.log(`[MiraiShop]\nData Source: Firestore\nProducts Loaded: ${products.length}`);
      callback(products);
    }, (error) => {
      console.error("Error subscribing to products:", error);
      if (onError) onError(error);
    });
  }

  async update(id: string, product: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> {
    if (isMockFirebase) {
      const products = this.getMockProducts();
      const index = products.findIndex(p => p.id === id);
      if (index !== -1) {
        products[index] = {
          ...products[index],
          ...product
        };
        this.saveMockProducts(products);
      }
      return;
    }

    const cleanProduct = Object.fromEntries(
      Object.entries(product).filter(([_, v]) => v !== undefined)
    );

    const docRef = doc(db, 'productos', id);
    await updateDoc(docRef, cleanProduct);
  }

  async delete(id: string): Promise<void> {
    if (isMockFirebase) {
      const products = this.getMockProducts();
      const updated = products.filter(p => p.id !== id);
      this.saveMockProducts(updated);
      return;
    }

    const docRef = doc(db, 'productos', id);
    await deleteDoc(docRef);
  }
}
