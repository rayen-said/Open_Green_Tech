import { IsString } from 'class-validator';

export class SupabaseTokenDto {
  @IsString()
  accessToken!: string;
}
