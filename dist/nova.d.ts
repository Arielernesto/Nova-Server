import { IncomingMessage, ServerResponse } from 'http';
interface ExtendedServerResponse extends ServerResponse {
    sendFile: (filePath: string) => void;
}
type NextFunction = (err?: any) => void;
type RequestHandler = (req: IncomingMessage & {
    params?: {
        [key: string]: string;
    };
    body?: any;
}, res: ExtendedServerResponse, next: NextFunction) => void;
declare class Nova {
    private middlewares;
    private routes;
    private errorHandler;
    use(middleware: RequestHandler): void;
    get(path: string, handler: RequestHandler): void;
    post(path: string, handler: RequestHandler): void;
    put(path: string, handler: RequestHandler): void;
    delete(path: string, handler: RequestHandler): void;
    all(path: string, handler: RequestHandler): void;
    private addRoute;
    private pathToRegexp;
    private matchRoute;
    private handleRequest;
    listen(port: number | string, callback?: () => void): void;
}
export default Nova;
