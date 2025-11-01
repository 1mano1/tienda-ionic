Tienda Ionic (Ionic 7 + Angular)

Aplicación móvil simple para gestión de tienda construida con Ionic 7 + Angular, usando localStorage para persistencia.
Incluye autenticación (demo), CRUD de productos y clientes, módulo de ventas con control de stock y módulo de reportes.

✨ Características

Autenticación: login y registro con auto-login desde localStorage.

Interfaz principal: barra superior con imagen y nombre de tienda, y navegación a módulos.

Productos: CRUD completo con stock, costo, precio de venta e imagen.

Clientes: CRUD completo con domicilio, teléfono, correo e imagen.

Ventas: selección de cliente, carrito por productos, validación/descuento de stock y total.

Reportes: totales de ventas, ingresos, artículos vendidos, top cliente y top producto.

Persistencia: todo almacenado en localStorage (sin backend).

🧱 Tecnologías

Ionic 7
 (standalone components)

Angular

localStorage (persistencia local)

🗂 Estructura relevante

Solo se listan archivos que existen y fueron modificados en esta solución.

src/
  app/
    app.component.ts
    app.routes.ts
    home/
      home.page.html
      home.page.ts


home.page.html: plantilla con login/registro y secciones de la app.

home.page.ts: lógica de autenticación, CRUDs, ventas y reportes.

app.routes.ts: enruta a HomePage y redirige la raíz.

app.component.ts: bootstrap de Ionic.

🚀 Cómo ejecutar

Instala dependencias:

npm install


Levanta el servidor de desarrollo:

ionic serve


Abre en el navegador: http://localhost:8100/

Requisitos típicos: Node LTS, Ionic CLI y Angular CLI instalados globalmente.

🧪 Flujo de uso (demo)

Registro

Crea un usuario con: Usuario, Contraseña, Nombre de tienda e Imagen/URL de tienda.

Se guarda el usuario y te deja en sesión (auto-login la próxima vez).

Productos

Crea productos con: Nombre, Descripción, Existencias, Precio costo, Precio venta e Imagen/URL.

Edita o elimina desde la tarjeta de cada producto.

Clientes

Crea clientes con: Nombre, Domicilio, Teléfono, Correo, Imagen/URL.

Edita o elimina desde la lista.

Ventas

Selecciona cliente y agrega productos con cantidad.

Se valida stock y se descuenta automáticamente al guardar.

Se guarda un historial de ventas con fecha, totales e items.

Reportes

Visualiza: total de ventas, ingresos acumulados, artículos vendidos,
cliente con mayor monto y producto más vendido por cantidad.

🧩 Mapeo a requerimientos
1) Módulo de Autenticación

Login y Registro en home.page.html (conmutados por authMode).

Auto-login: la sesión se lee en el constructor (SESSION_KEY).

Datos del usuario (en USERS_KEY):

id autogenerado (UUID),

username, password,

storeName, storeImage.

2) Interfaz Principal

Barra superior con:

Imagen de la tienda (session.storeImage con fallback),

Nombre de la tienda (session.storeName).

Menú de navegación con botones a todos los módulos:
dashboard, products, clients, sales, reports.

3) Módulo de Productos (CRUD)

Crear/Editar/Eliminar/Listar.

Datos: id, name, description, stock, costPrice, salePrice, image.

4) Módulo de Clientes (CRUD)

Crear/Editar/Eliminar/Listar.

Datos: id, name, address, phone, email, image.

5) Opcionales (Bonus)

Ventas: selección de cliente, carrito con items, total, validación/descuento de stock, historial.

Reportes: totales, ingresos, artículos vendidos, top cliente, top producto.

💾 Persistencia (localStorage)

Claves usadas:

users — lista de usuarios registrados.

session_user — usuario en sesión (auto-login).

products — arreglo de productos.

clients — arreglo de clientes.

sales — arreglo de ventas.

Para “resetear” la app: borra estas claves desde DevTools → Application → Local Storage → localhost:8100.

⚠️ Notas de seguridad (demo académica)

Contraseñas en texto plano (simple para práctica).
Mejora sugerida: aplicar hash SHA-256 en registro y comparar en login.

No hay backend ni control de roles/permisos.

🛠 Solución de problemas

Error NG5002 / etiquetas mal cerradas: asegúrate de que todas las etiquetas sean <ion-label>...</ion-label> y no </ionlabel>.

Imagen de tienda no aparece: coloca una URL válida o agrega un assets/store-placeholder.png.

Auto-login no funciona: verifica que session_user exista en localStorage después de registrar o iniciar sesión.

📌 Mejoras futuras (opcionales)

Hasheo de contraseñas y validaciones más estrictas.

Menú lateral (ion-menu) y rutas por módulo.

Reportes con rango de fechas y exportar CSV.

Exportar ticket de venta (PDF/Impresión).

Búsqueda y filtros en productos/clientes.