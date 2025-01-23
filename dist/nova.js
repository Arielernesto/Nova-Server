"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importStar(require("http"));
const url_1 = require("url");
const fs_1 = require("fs");
const path_1 = require("path");
function extendServerResponse(res) {
    const extendedRes = res;
    extendedRes.sendFile = function (filePath) {
        // Resolver la ruta completa del archivo
        const resolvedPath = (0, path_1.resolve)(filePath);
        // Verificar si el archivo existe
        if ((0, fs_1.existsSync)(resolvedPath)) {
            // Obtener el tamaño del archivo
            const stat = (0, fs_1.statSync)(resolvedPath);
            // Configurar las cabeceras
            extendedRes.writeHead(200, {
                'Content-Length': stat.size,
                'Content-Type': getContentType(resolvedPath),
            });
            // Crear un flujo de lectura y canalizarlo a la respuesta
            const readStream = (0, fs_1.createReadStream)(resolvedPath);
            readStream.pipe(extendedRes);
        }
        else {
            // Enviar un error 404 si el archivo no existe
            extendedRes.writeHead(404, { 'Content-Type': 'text/plain' });
            extendedRes.end('Not Found');
        }
    };
    return extendedRes;
}
// Función para determinar el tipo de contenido basado en la extensión del archivo
function getContentType(filePath) {
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
http_1.default.ServerResponse.prototype.sendFile = function (filePath) {
    const extendedRes = extendServerResponse(this);
    extendedRes.sendFile(filePath);
};
class Nova {
    constructor() {
        this.middlewares = [];
        this.routes = [];
        this.errorHandler = (err, req, res, next) => {
            res.statusCode = 500;
            res.end('Internal Server Error');
        };
    }
    use(middleware) {
        this.middlewares.push(middleware);
    }
    get(path, handler) {
        this.addRoute('GET', path, handler);
    }
    post(path, handler) {
        this.addRoute('POST', path, handler);
    }
    put(path, handler) {
        this.addRoute('PUT', path, handler);
    }
    delete(path, handler) {
        this.addRoute('DELETE', path, handler);
    }
    all(path, handler) {
        this.addRoute('ALL', path, handler);
    }
    addRoute(method, path, handler) {
        const keys = [];
        const regexp = this.pathToRegexp(path, keys);
        this.routes.push({ method, path, keys, regexp, handler });
    }
    pathToRegexp(path, keys) {
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
    matchRoute(method, requestUrl) {
        for (const route of this.routes) {
            if ((route.method === method || route.method === 'ALL') && route.regexp.test(requestUrl)) {
                const match = route.regexp.exec(requestUrl);
                const params = {};
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
    handleRequest(req, res, handler) {
        const middlewares = [...this.middlewares, handler];
        let index = 0;
        const next = (err) => {
            if (err) {
                return this.errorHandler(err, req, res, next);
            }
            if (index < middlewares.length) {
                try {
                    middlewares[index++](req, res, next);
                }
                catch (error) {
                    next(error);
                }
            }
        };
        res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
        };
        next();
    }
    listen(port, callback) {
        const server = (0, http_1.createServer)((req, res) => {
            const { method, url: requestUrl } = req;
            const parsedUrl = (0, url_1.parse)(requestUrl || '', true);
            const result = this.matchRoute(method, parsedUrl.pathname || '');
            if (result) {
                req.params = result.params;
                this.handleRequest(req, res, result.handler);
            }
            else {
                res.statusCode = 404;
                res.end('Not Found');
            }
        });
        server.listen(port, callback);
    }
}
exports.default = Nova;
