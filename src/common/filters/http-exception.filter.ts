/*
 * @Description:
 * @Author: FuHang
 * @Date: 2022-09-26 23:04:51
 * @LastEditTime: 2023-03-30 01:40:46
 * @LastEditors: Please set LastEditors
 * @FilePath: \nest-service\src\common\filters\http-exception.filter.ts
 */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { getReqMainInfo } from '../utils/utils';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  // 注入日志服务相关依赖
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const response: any = exception.getResponse();
    const { error, message } = response;

    let msg =
      exception.message || (status >= 500 ? 'Service Error' : 'Client Error');
    if (
      Object.prototype.toString.call(response) === '[object Object]' &&
      response.message
    ) {
      msg = response.message;
    }

    // 记录日志（错误消息，错误码，请求信息等）
    this.logger.error(msg, {
      status,
      req: getReqMainInfo(req),
      // stack: exception.stack,
    });

    res.status(status).json({
      status,
      success: false,
      timestamp: new Date().toISOString(),
      path: req.url,
      error,
      message: msg || message || exception.getResponse(),
    });
  }
}