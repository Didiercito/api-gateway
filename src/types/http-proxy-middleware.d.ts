import 'http-proxy-middleware';
import { IncomingMessage, ServerResponse } from 'http';

declare module 'http-proxy-middleware' {
  export interface Options<Request extends IncomingMessage = IncomingMessage, Response extends ServerResponse = ServerResponse> {
    onProxyReq?: (proxyReq: any, req: Request, res: Response) => void;
    onProxyRes?: (proxyRes: any, req: Request, res: Response) => void;
  }
}
