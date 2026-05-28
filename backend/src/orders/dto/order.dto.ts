import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CartItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class ShippingAddressDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(1)
  address1!: string;

  @IsOptional()
  @IsString()
  address2?: string;

  @IsString()
  @MinLength(1)
  city!: string;

  @IsString()
  @MinLength(1)
  postalCode!: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class CreateCheckoutDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shipping!: ShippingAddressDto;

  @IsOptional()
  saveAddress?: boolean;
}

export class UpdateOrderStatusDto {
  @IsEnum(['PENDING', 'PAID', 'FULFILLED', 'CANCELLED', 'REFUNDED'] as const)
  status!: 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED' | 'REFUNDED';
}
