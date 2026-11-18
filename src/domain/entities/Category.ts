export interface Category {
  /** Slug del nombre (sin tildes, en minúsculas). Se usa como id del documento. */
  id: string;
  nombre: string;
  createdAt?: string;
}
