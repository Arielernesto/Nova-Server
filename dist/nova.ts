import http, { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { existsSync, createReadStream, statSync } from 'fs';
import { join, resolve } from 'path';

// Extender ServerResponse para añadir el método sendFile
interface ExtendedServerResponse extends ServerResponse {
  sendFile: (filePath: string) => void;
}

function extendServerResponse(res: ServerResponse): ExtendedServerResponse {
  const extendedRes = res as ExtendedServerResponse;
  extendedRes.sendFile = function (filePath: string) {
    // Resolver la ruta completa del archivo
    const resolvedPath = resolve(filePath);
    // Verificar si el archivo existe
    if (existsSync(resolvedPath)) {
      // Obtener el tamaño del archivo
      const stat = statSync(resolvedPath);
      // Configurar las cabeceras
      extendedRes.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': getContentType(resolvedPath),
      });
      // Crear un flujo de lectura y canalizarlo a la respuesta
      const readStream = createReadStream(resolvedPath);
      readStream.pipe(extendedRes);
    } else {
      // Enviar un error 404 si el archivo no existe
      extendedRes.writeHead(404, { 'Content-Type': 'text/plain' });
      extendedRes.end('Not Found');
    }
  };
  return extendedRes;
}

// Función para determinar el tipo de contenido basado en la extensión del archivo
function getContentType(filePath: string): string {
  const ext = filePath.split('.').pop();
  switch (ext) {
    case 'html':
      return 'text/html';
    case 'js':
      return 'application/javascript';
    case 'css':
      return 'text/css';
    case 'json':
      return 'application/json';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

// Extender el prototipo de ServerResponse
http.ServerResponse.prototype.sendFile = function (filePath: string) {
  const extendedRes = extendServerResponse(this);
  extendedRes.sendFile(filePath);
};

type NextFunction = (err?: any) => void;
type RequestHandler = (req: IncomingMessage & { params?: { [key: string]: string }; body?: any }, res: ExtendedServerResponse, next: NextFunction) => void;

class Nova {
  private middlewares: RequestHandler[] = [];
  private routes: { method: string, path: string, keys: string[], regexp: RegExp, handler: RequestHandler }[] = [];
  private errorHandler: RequestHandler = (err, req, res, next) => {
    res.statusCode = 500;
    res.end('Internal Server Error');
  };

  use(middleware: RequestHandler): void {
    this.middlewares.push(middleware);
  }

  get(path: string, handler: RequestHandler): void {
    this.addRoute('GET', path, handler);
  }

  post(path: string, handler: RequestHandler): void {
    this.addRoute('POST', path, handler);
  }

  put(path: string, handler: RequestHandler): void {
    this.addRoute('PUT', path, handler);
  }

  delete(path: string, handler: RequestHandler): void {
    this.addRoute('DELETE', path, handler);
  }

  all(path: string, handler: RequestHandler): void {
    this.addRoute('ALL', path, handler);
  }

  private addRoute(method: string, path: string, handler: RequestHandler): void {
    const keys: string[] = [];
    const regexp = this.pathToRegexp(path, keys);
    this.routes.push({ method, path, keys, regexp, handler });
  }

  private pathToRegexp(path: string, keys: string[]): RegExp {
    const parts = path.split('/').filter(Boolean);
    const pattern = parts.map(part => {
      if (part.startsWith(':')) {
        keys.push(part.substring(1));
        return '([^/]+)';
      }
      return part;
    }).join('/');
    return new RegExp(`^/${pattern}$`);
  }

  private matchRoute(method: string, requestUrl: string): { handler: RequestHandler, params: { [key: string]: string } } | undefined {
    for (const route of this.routes) {
      if ((route.method === method || route.method === 'ALL') && route.regexp.test(requestUrl)) {
        const match = route.regexp.exec(requestUrl);
        const params: { [key: string]: string } = {};
        if (match) {
          route.keys.forEach((key, index) => {
            params[key] = match[index + 1];
          });
        }
        return { handler: route.handler, params };
      }
    }
    return undefined;
  }

  private handleRequest(req: IncomingMessage & { params?: { [key: string]: string }; body?: any }, res: ExtendedServerResponse, handler: RequestHandler): void {
    const middlewares = [...this.middlewares, handler];
    let index = 0;

    const next: NextFunction = (err?: any): void => {
      if (err) {
        return this.errorHandler(err, req, res, next);
      }
      if (index < middlewares.length) {
        try {
          middlewares[index++](req, res, next);
        } catch (error) {
          next(error);
        }
      }
    };

    res.json = (data: any) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    };

    next();
  }

  listen(port: number | string, callback?: () => void): void {
    const server = createServer((req, res) => {
      const { method, url: requestUrl } = req;
      const parsedUrl = parse(requestUrl || '', true);
      const result = this.matchRoute(method!, parsedUrl.pathname || '');

      if (result) {
        req.params = result.params;
        this.handleRequest(req as IncomingMessage & { params?: { [key: string]: string }; body?: any }, res as ExtendedServerResponse, result.handler);
      } else {
        res.statusCode = 404;
        res.end('Not Found');
      }
    });

    server.listen(port, callback);
  }
}

export default Nova;