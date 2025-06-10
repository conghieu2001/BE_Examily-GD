import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Generic API response structure
 */
export interface ApiResponse<T> {
    statusCode: number;
    message: string | null;
    data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
        return next.handle().pipe(
            map(data => {
                const response = context.switchToHttp().getResponse();
                return {
                    statusCode: response.statusCode || 200,
                    message: response.locals?.message || 'Success',
                    data,
                };
            }),
        );
    }
}
