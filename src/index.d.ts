export type ViaTokenFn = (req: any, res: any, arg?: string) => string | number;

export type ViaFormat =
  | string
  | ((token: (name: string, arg?: string) => string, req: any, res: any) => string | object);

export interface ViaOptions {
  format?: ViaFormat;
  stream?: NodeJS.WritableStream;
  skip?: (req: any, res: any) => boolean;
  colors?: boolean;
  immediate?: boolean;
  eol?: string;
}

declare function via(options?: ViaFormat | ViaOptions): (req: any, res: any, next: (err?: any) => void) => void;

declare namespace via {
  function token(name: string, fn: ViaTokenFn): typeof via;
  function format(name: string, fmt: any): typeof via;
  const FORMATS: Record<string, string>;
  const TOKENS: Record<string, ViaTokenFn>;
  const colors: Record<string, string>;
}

export default via;