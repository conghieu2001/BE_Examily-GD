import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseBooleanPipe implements PipeTransform<string, boolean> {
    transform(value: string): boolean {
        if (value === undefined || value === null) {
            throw new BadRequestException('Validation failed. Boolean value is required.');
        }

        const val = value.toLowerCase();

        if (val === 'true' || val === '1') {
            return true;
        }

        if (val === 'false' || val === '0') {
            return false;
        }

        throw new BadRequestException(`Validation failed. "${value}" is not a valid boolean value.`);
    }
}
