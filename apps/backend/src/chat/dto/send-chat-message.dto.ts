import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendChatMessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(1200)
  prompt!: string;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'fr', 'ar'])
  language?: 'en' | 'fr' | 'ar';

  @IsOptional()
  @IsString()
  deviceId?: string;
}
