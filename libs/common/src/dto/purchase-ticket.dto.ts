import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class PurchaseTicketDto {
  @IsUUID('4')
  eventId: string;

  @IsInt()
  @Min(1)
  @Max(10)
  quantity: number;
}
