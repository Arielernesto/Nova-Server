¡Claro! A continuación se detalla la documentación de la librería `Nova`, describiendo cada método y su funcionamiento.

# Nova

Nova es una librería ligera para construir servidores HTTP en Node.js, similar a Express. Proporciona una API sencilla para manejar rutas, middlewares y respuestas de archivos estáticos.

## Instalación

Para instalar Nova, simplemente clona el repositorio y añádelo a tu proyecto.

```bash
git clone <URL-DEL-REPOSITORIO>
cd nova
npm install
```

## Uso Básico

```javascript
const Nova = require('./path/to/nova');

const app = new Nova();

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/hello/:name', (req, res) => {
  res.json({ message: `Hello, ${req.params.name}!` });
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
```

## Métodos

### `use(middleware: RequestHandler): void`

Agrega un middleware que se ejecutará en todas las solicitudes.

- **Parámetros:**
  - `middleware`: Función que toma tres parámetros: `req`, `res` y `next`.

### `get(path: string, handler: RequestHandler): void`

Define una ruta que responde a solicitudes `GET`.

- **Parámetros:**
  - `path`: Ruta para la cual este manejador responderá.
  - `handler`: Función que toma tres parámetros: `req`, `res` y `next`.

### `post(path: string, handler: RequestHandler): void`

Define una ruta que responde a solicitudes `POST`.

- **Parámetros:**
  - `path`: Ruta para la cual este manejador responderá.
  - `handler`: Función que toma tres parámetros: `req`, `res` y `next`.

### `put(path: string, handler: RequestHandler): void`

Define una ruta que responde a solicitudes `PUT`.

- **Parámetros:**
  - `path`: Ruta para la cual este manejador responderá.
  - `handler`: Función que toma tres parámetros: `req`, `res` y `next`.

### `delete(path: string, handler: RequestHandler): void`

Define una ruta que responde a solicitudes `DELETE`.

- **Parámetros:**
  - `path`: Ruta para la cual este manejador responderá.
  - `handler`: Función que toma tres parámetros: `req`, `res` y `next`.

### `all(path: string, handler: RequestHandler): void`

Define una ruta que responde a todas las solicitudes HTTP.

- **Parámetros:**
  - `path`: Ruta para la cual este manejador responderá.
  - `handler`: Función que toma tres parámetros: `req`, `res` y `next`.

### `listen(port: number | string, callback?: () => void): void`

Inicia el servidor en el puerto especificado.

- **Parámetros:**
  - `port`: Número de puerto o cadena.
  - `callback`: Función opcional que se ejecutará cuando el servidor comience a escuchar.

## Extensiones de `ServerResponse`

### `sendFile(filePath: string): void`

Envía un archivo estático al cliente.

- **Parámetros:**
  - `filePath`: Ruta del archivo a enviar.

### `json(data: any): void`

Envía una respuesta JSON al cliente.

- **Parámetros:**
  - `data`: Datos a enviar como JSON.

## Ejemplo Completo

```javascript
const Nova = require('./path/to/nova');

const app = new Nova();

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/hello/:name', (req, res) => {
  res.json({ message: `Hello, ${req.params.name}!` });
});

app.get('/file', (req, res) => {
  res.sendFile('path/to/your/file.txt');
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
```

## Notas

- Nova utiliza expresiones regulares personalizadas para manejar rutas dinámicas.
- Los middlewares son funciones que reciben tres parámetros: `req`, `res` y `next`.
- Los métodos `sendFile` y `json` están disponibles en el objeto `res` para facilitar el envío de archivos y respuestas JSON.

Con esta documentación, deberías tener una comprensión clara de cómo usar y extender la librería Nova en tus proyectos. Si tienes alguna pregunta o necesitas más ejemplos, no dudes en consultarme.