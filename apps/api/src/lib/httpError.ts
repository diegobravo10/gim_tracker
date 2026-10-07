export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }

  static notFound(message: string) {
    return new HttpError(404, 'NOT_FOUND', message);
  }

  static conflict(code: string, message: string) {
    return new HttpError(409, code, message);
  }
}
