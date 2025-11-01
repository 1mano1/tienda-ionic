import { Component } from '@angular/core';
import {
  // Componentes standalone de Ionic usados en la plantilla
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonAvatar,
  IonList, IonItem, IonLabel, IonInput, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonGrid, IonRow, IonCol, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, DatePipe } from '@angular/common';

/* ============================================================
 * Tipos / Modelos de datos (en memoria y localStorage)
 * ============================================================ */

type User = {
  id: string;           // UUID autogenerado
  username: string;     // nombre de usuario (login)
  password: string;     // contraseña (para demo, texto plano)
  storeName: string;    // nombre de la tienda
  storeImage: string;   // URL o base64 de imagen de tienda
};

type Product = {
  id: string;           // UUID autogenerado
  name: string;         // nombre del producto
  description: string;  // descripción
  stock: number;        // existencias
  costPrice: number;    // precio de costo
  salePrice: number;    // precio de venta
  image: string;        // URL/base64 de imagen
};

type Client = {
  id: string;           // UUID autogenerado
  name: string;         // nombre
  address: string;      // domicilio
  phone: string;        // teléfono
  email: string;        // correo electrónico
  image: string;        // URL/base64 de imagen
};

type SaleItem = {
  productId: string;    // referencia al producto
  name: string;         // nombre (copiado para snapshot textual)
  qty: number;          // cantidad vendida
  price: number;        // precio unitario (venta)
  subtotal: number;     // qty * price
};

type Sale = {
  id: string;           // UUID autogenerado
  date: string;         // ISO string de la fecha de venta
  clientId: string;     // referencia al cliente
  clientName: string;   // nombre del cliente (snapshot textual)
  items: SaleItem[];    // línea(s) de la venta
  total: number;        // suma de subtotales
};

/* ============================================================
 * Claves de localStorage para persistencia
 * ============================================================ */
const USERS_KEY    = 'users';
const SESSION_KEY  = 'session_user';
const PRODUCTS_KEY = 'products';
const CLIENTS_KEY  = 'clients';
const SALES_KEY    = 'sales';

/**
 * Componente principal (standalone) que concentra:
 * - Autenticación (login/registro + auto-login)
 * - CRUD de Productos y Clientes
 * - Ventas con control de stock
 * - Reportes agregados
 */
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  // Declaración de módulos/standalone components usados en la plantilla
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonAvatar,
    IonList, IonItem, IonLabel, IonInput, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonGrid, IonRow, IonCol, IonSelect, IonSelectOption,
    FormsModule, NgIf, NgFor, DatePipe
  ],
})
export class HomePage {

  /* ===================== Autenticación ===================== */

  /** Modo de pantalla actual para auth (login o register). */
  authMode: 'login' | 'register' = 'login';

  /** Mensaje de error de autenticación (login/register). */
  authError = '';

  /** Usuario en sesión (null si no hay sesión). */
  session: User | null = null;

  /** Modelo de formulario de login (two-way binding con la plantilla). */
  loginForm = { username: '', password: '' };

  /** Modelo de formulario de registro. */
  registerForm = { username: '', password: '', storeName: '', storeImage: '' };

  /* ===================== UI / Navegación simple ===================== */

  /**
   * Sección visible actual de la app.
   * dashboard | products | clients | sales | reports
   */
  section: 'dashboard' | 'products' | 'clients' | 'sales' | 'reports' = 'dashboard';

  /* ===================== Productos ===================== */

  /** Lista completa de productos (persistida en localStorage). */
  products: Product[] = [];

  /**
   * Modelo de formulario de producto (parcial para soportar edición).
   * Si tiene `id`, se actualiza; si no, se crea.
   */
  productForm: Partial<Product> = { stock: 0, costPrice: 0, salePrice: 0 };

  /* ===================== Clientes ===================== */

  /** Lista completa de clientes (persistida en localStorage). */
  clients: Client[] = [];

  /** Modelo de formulario de cliente (parcial para edición). */
  clientForm: Partial<Client> = {};

  /* ===================== Ventas ===================== */

  /** Historial de ventas (persistido). */
  sales: Sale[] = [];

  /** Formulario de venta: cliente + items. */
  saleForm: { clientId?: string; items: SaleItem[] } = { items: [] };

  /** Selección temporal de producto y cantidad a agregar. */
  saleAdd: { productId?: string; qty: number } = { qty: 1 };

  /** Mensaje de error en flujo de venta (stock, validaciones). */
  saleError = '';

  /* ===================== Reportes (agregados) ===================== */

  /**
   * Resumen de reportes calculados a partir de `sales`:
   * - totalSales: número de ventas
   * - totalRevenue: suma de totales
   * - totalItems: suma de cantidades vendidas
   * - topClient: cliente con mayor monto
   * - topProduct: producto con mayor cantidad vendida
   */
  report = {
    totalSales: 0,
    totalRevenue: 0,
    totalItems: 0,
    topClient: { name: '', amount: 0 } as { name: string; amount: number } | null,
    topProduct: { name: '', qty: 0 } as { name: string; qty: number } | null
  };

  constructor() {
    // ===== Auto-login =====
    // Si existe un usuario en sesión guardado, recupéralo.
    const storedSession = this.get<User | null>(SESSION_KEY, null);
    if (storedSession) this.session = storedSession;

    // ===== Cargar datos de la app =====
    this.products = this.get<Product[]>(PRODUCTS_KEY, []);
    this.clients  = this.get<Client[]>(CLIENTS_KEY, []);
    this.sales    = this.get<Sale[]>(SALES_KEY, []);
    this.refreshReport(); // Inicializa métricas agregadas
  }

  /* ============================================================
   * Helpers de persistencia (localStorage) y utilidades
   * ============================================================ */

  /** Lee una clave de localStorage y la parsea como JSON. */
  private get<T>(key: string, fallback: T): T {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  }

  /** Escribe en localStorage serializando a JSON. */
  private set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /** Genera un UUID (usa crypto.randomUUID si está disponible). */
  private uuid(): string {
    return (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
  }

  /* ============================================================
   * Autenticación (login, registro, logout)
   * ============================================================ */

  /** Cambia entre formulario de login y de registro. */
  switchAuth(mode: 'login'|'register') {
    this.authMode = mode;
    this.authError = '';
  }

  /** Intenta iniciar sesión con las credenciales del formulario. */
  doLogin() {
    const users = this.get<User[]>(USERS_KEY, []);
    const u = users.find(x => x.username === this.loginForm.username && x.password === this.loginForm.password);
    if (!u) { this.authError = 'Credenciales inválidas'; return; }
    this.session = u;
    this.set(SESSION_KEY, u);  // Persiste sesión (auto-login)
    this.authError = '';
  }

  /** Registra un nuevo usuario y lo deja en sesión. */
  doRegister() {
    const { username, password, storeName, storeImage } = this.registerForm;

    // Validación mínima de campos requeridos
    if (!username || !password || !storeName) {
      this.authError = 'Completa los campos obligatorios';
      return;
    }

    const users = this.get<User[]>(USERS_KEY, []);

    // Evitar duplicados de username
    if (users.some(u => u.username === username)) {
      this.authError = 'El nombre de usuario ya existe';
      return;
    }

    // Crear y persistir usuario
    const newUser: User = { id: this.uuid(), username, password, storeName, storeImage };
    users.push(newUser);
    this.set(USERS_KEY, users);

    // Dejarlo en sesión inmediatamente
    this.set(SESSION_KEY, newUser);
    this.session = newUser;

    // Volver a login visualmente (opcional)
    this.authMode = 'login';
    this.authError = '';
  }

  /** Cierra la sesión del usuario actual. */
  logout() {
    localStorage.removeItem(SESSION_KEY);
    this.session = null;
    this.section = 'dashboard';           // Vuelve a inicio
    this.loginForm = { username: '', password: '' }; // Limpia form login
  }

  /* ============================================================
   * Productos (CRUD básico en memoria + persistencia)
   * ============================================================ */

  /** Crea o actualiza un producto según haya o no `productForm.id`. */
  saveProduct() {
    const list = [...this.products];

    if (this.productForm.id) {
      // Edición (upsert por id)
      const i = list.findIndex(p => p.id === this.productForm.id);
      list[i] = { ...(list[i]), ...(this.productForm as Product) };
    } else {
      // Creación
      const item: Product = {
        id: this.uuid(),
        name: this.productForm.name || '',
        description: this.productForm.description || '',
        stock: Number(this.productForm.stock || 0),
        costPrice: Number(this.productForm.costPrice || 0),
        salePrice: Number(this.productForm.salePrice || 0),
        image: this.productForm.image || ''
      };
      list.push(item);
    }

    // Persistir y refrescar estado/form
    this.products = list;
    this.set(PRODUCTS_KEY, list);
    this.resetProduct();
  }

  /** Carga un producto al formulario para edición. */
  editProduct(p: Product) {
    this.productForm = { ...p };
  }

  /** Elimina un producto por id. */
  deleteProduct(id: string) {
    this.products = this.products.filter(p => p.id !== id);
    this.set(PRODUCTS_KEY, this.products);
    if (this.productForm.id === id) this.resetProduct();
  }

  /** Limpia el formulario de producto a valores por defecto. */
  resetProduct() {
    this.productForm = { stock: 0, costPrice: 0, salePrice: 0 };
  }

  /* ============================================================
   * Clientes (CRUD básico en memoria + persistencia)
   * ============================================================ */

  /** Crea o actualiza un cliente según haya o no `clientForm.id`. */
  saveClient() {
    const list = [...this.clients];

    if (this.clientForm.id) {
      // Edición
      const i = list.findIndex(c => c.id === this.clientForm.id);
      list[i] = { ...(list[i]), ...(this.clientForm as Client) };
    } else {
      // Creación
      const item: Client = {
        id: this.uuid(),
        name: this.clientForm.name || '',
        address: this.clientForm.address || '',
        phone: this.clientForm.phone || '',
        email: this.clientForm.email || '',
        image: this.clientForm.image || ''
      };
      list.push(item);
    }

    // Persistir y refrescar estado/form
    this.clients = list;
    this.set(CLIENTS_KEY, list);
    this.resetClient();
  }

  /** Carga un cliente al formulario para edición. */
  editClient(c: Client) {
    this.clientForm = { ...c };
  }

  /** Elimina un cliente por id. */
  deleteClient(id: string) {
    this.clients = this.clients.filter(c => c.id !== id);
    this.set(CLIENTS_KEY, this.clients);
    if (this.clientForm.id === id) this.resetClient();
  }

  /** Limpia el formulario de cliente. */
  resetClient() {
    this.clientForm = {};
  }

  /* ============================================================
   * Ventas (carrito, validación de stock, persistencia)
   * ============================================================ */

  /** Total calculado de la venta actual (suma de subtotales). */
  get saleTotal(): number {
    return this.saleForm.items.reduce((acc, it) => acc + it.subtotal, 0);
  }

  /**
   * Agrega un producto al carrito de la venta actual.
   * - Valida que exista producto y cantidad > 0
   * - Verifica que no supere el stock disponible
   * - Si existe ya en carrito, acumula cantidad
   */
  addItemToSale() {
    this.saleError = '';

    const pid = this.saleAdd.productId;
    const qty = Number(this.saleAdd.qty || 0);

    if (!pid || qty <= 0) {
      this.saleError = 'Selecciona producto y cantidad válida';
      return;
    }

    const p = this.products.find(x => x.id === pid);
    if (!p) {
      this.saleError = 'Producto no encontrado';
      return;
    }

    if (qty > p.stock) {
      this.saleError = `Stock insuficiente. Disponible: ${p.stock}`;
      return;
    }

    // Acumular si el producto ya está en el carrito
    const existing = this.saleForm.items.find(i => i.productId === pid);
    if (existing) {
      if (existing.qty + qty > p.stock) {
        this.saleError = `Supera stock. Disponible: ${p.stock}`;
        return;
      }
      existing.qty += qty;
      existing.subtotal = existing.qty * existing.price;
    } else {
      this.saleForm.items.push({
        productId: p.id,
        name: p.name,
        qty,
        price: p.salePrice,
        subtotal: qty * p.salePrice
      });
    }

    // Reset rápido del selector de cantidad (deja el producto seleccionado)
    this.saleAdd = { qty: 1 };
  }

  /** Quita una línea del carrito por índice. */
  removeItemFromSale(index: number) {
    this.saleForm.items.splice(index, 1);
  }

  /**
   * Guarda la venta:
   * - Valida que haya cliente y al menos un item
   * - Reconfirma stock (por si hubo cambios intermedios)
   * - Descuenta stock de productos y persiste
   * - Persiste la venta en `SALES_KEY`
   * - Resetea formulario y actualiza reportes
   */
  saveSale() {
    this.saleError = '';

    // Validaciones mínimas
    if (!this.saleForm.clientId) {
      this.saleError = 'Selecciona un cliente';
      return;
    }
    if (!this.saleForm.items.length) {
      this.saleError = 'Agrega al menos un producto';
      return;
    }

    // Validar stock final contra inventario actual
    for (const it of this.saleForm.items) {
      const p = this.products.find(x => x.id === it.productId)!;
      if (it.qty > p.stock) {
        this.saleError = `Stock insuficiente para ${p.name}`;
        return;
      }
    }

    // Descontar stock y persistir productos
    const newProducts = this.products.map(p => {
      const it = this.saleForm.items.find(i => i.productId === p.id);
      return it ? { ...p, stock: p.stock - it.qty } : p;
    });
    this.products = newProducts;
    this.set(PRODUCTS_KEY, newProducts);

    // Construir objeto de venta (snapshot de items y cliente)
    const client = this.clients.find(c => c.id === this.saleForm.clientId)!;
    const total = this.saleForm.items.reduce((a, i) => a + i.subtotal, 0);

    const sale: Sale = {
      id: this.uuid(),
      date: new Date().toISOString(),
      clientId: client.id,
      clientName: client.name,
      items: JSON.parse(JSON.stringify(this.saleForm.items)),
      total
    };

    // Persistir venta
    const list = [...this.sales, sale];
    this.sales = list;
    this.set(SALES_KEY, list);

    // Reset de formulario y actualización de métricas
    this.resetSale();
    this.refreshReport();
  }

  /** Limpia el formulario de venta y errores. */
  resetSale() {
    this.saleForm = { items: [] };
    this.saleAdd = { qty: 1 };
    this.saleError = '';
  }

  /* ============================================================
   * Reportes (cálculos agregados basados en `sales`)
   * ============================================================ */

  /**
   * Recalcula las métricas agregadas:
   * - total de ventas / ingresos / artículos
   * - cliente top por monto
   * - producto top por cantidad
   */
  private refreshReport() {
    const totalSales   = this.sales.length;
    const totalRevenue = this.sales.reduce((a, s) => a + s.total, 0);

    // Total de artículos vendidos (suma de qty)
    const totalItems   = this.sales.reduce(
      (a, s) => a + s.items.reduce((x, i) => x + i.qty, 0),
      0
    );

    // Agregación por cliente (monto total)
    const byClient = new Map<string, number>();
    const clientNames = new Map<string, string>();
    for (const s of this.sales) {
      byClient.set(s.clientId, (byClient.get(s.clientId) || 0) + s.total);
      clientNames.set(s.clientId, s.clientName);
    }

    let topClient: { name: string; amount: number } | null = null;
    for (const [id, amount] of byClient.entries()) {
      if (!topClient || amount > topClient.amount) {
        topClient = { name: clientNames.get(id) || id, amount };
      }
    }

    // Agregación por producto (cantidad total)
    const byProduct = new Map<string, { name: string; qty: number }>();
    for (const s of this.sales) {
      for (const it of s.items) {
        const cur = byProduct.get(it.productId) || { name: it.name, qty: 0 };
        cur.qty += it.qty;
        byProduct.set(it.productId, cur);
      }
    }

    let topProduct: { name: string; qty: number } | null = null;
    for (const v of byProduct.values()) {
      if (!topProduct || v.qty > topProduct.qty) {
        topProduct = { name: v.name, qty: v.qty };
      }
    }

    // Publicar resultados
    this.report = { totalSales, totalRevenue, totalItems, topClient, topProduct };
  }
}
