import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { Product } from '../../domain/entities/Product';
import { db } from './firebaseConfig';
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

export class FirebaseProductRepositoryImpl implements ProductRepository {
  private collectionRef = collection(db, 'productos');

  async create(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const docRef = await addDoc(this.collectionRef, {
      ...product,
      createdAt: serverTimestamp()
    });
    return {
      id: docRef.id,
      ...product,
    };
  }

  async getAll(): Promise<Product[]> {
    const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      products.push({
        id: docSnap.id,
        nombre: data.nombre,
        precioCliente: Number(data.precioCliente !== undefined ? data.precioCliente : (data.precio || 0)),
        precioMayorista: Number(data.precioMayorista !== undefined ? data.precioMayorista : (data.precio || 0)),
        stock: Number(data.stock),
        descripcion: data.descripcion,
        categoria: data.categoria,
        imagen: data.imagen || (data.imagenes && data.imagenes[0]) || '',
        imagenes: data.imagenes || (data.imagen ? [data.imagen] : []),
        activo: data.activo !== undefined ? data.activo : true,
        createdAt: data.createdAt,
      });
    });
    return products;
  }

  async getById(id: string): Promise<Product | null> {
    const docRef = doc(db, 'productos', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    const data = docSnap.data();
    return {
      id: docSnap.id,
      nombre: data.nombre,
      precioCliente: Number(data.precioCliente !== undefined ? data.precioCliente : (data.precio || 0)),
      precioMayorista: Number(data.precioMayorista !== undefined ? data.precioMayorista : (data.precio || 0)),
      stock: Number(data.stock),
      descripcion: data.descripcion,
      categoria: data.categoria,
      imagen: data.imagen || (data.imagenes && data.imagenes[0]) || '',
      imagenes: data.imagenes || (data.imagen ? [data.imagen] : []),
      activo: data.activo !== undefined ? data.activo : true,
      createdAt: data.createdAt,
    };
  }

  subscribeToAll(callback: (products: Product[]) => void): () => void {
    const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const products: Product[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        products.push({
          id: docSnap.id,
          nombre: data.nombre,
          precioCliente: Number(data.precioCliente !== undefined ? data.precioCliente : (data.precio || 0)),
          precioMayorista: Number(data.precioMayorista !== undefined ? data.precioMayorista : (data.precio || 0)),
          stock: Number(data.stock),
          descripcion: data.descripcion,
          categoria: data.categoria,
          imagen: data.imagen || (data.imagenes && data.imagenes[0]) || '',
          imagenes: data.imagenes || (data.imagen ? [data.imagen] : []),
          activo: data.activo !== undefined ? data.activo : true,
          createdAt: data.createdAt,
        });
      });
      callback(products);
    }, (error) => {
      console.error("Error subscribing to products:", error);
    });
  }

  async update(id: string, product: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, 'productos', id);
    await updateDoc(docRef, product);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'productos', id);
    await deleteDoc(docRef);
  }
}
