import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    InternalServerErrorException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            catchError((err) => {
                // Nếu đã là HttpException thì trả ra nguyên trạng
                if (err instanceof HttpException) {
                    return throwError(() => err);
                }

                // Nếu không phải HttpException thì trả về lỗi 500 mặc định
                return throwError(() => new InternalServerErrorException(err.message));
            }),
        );
    }
}
  