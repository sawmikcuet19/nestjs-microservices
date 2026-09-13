import { IsString } from 'class-validator';

export class CheckInTicketDto {
  @IsString()
  ticketCode: string;
}
