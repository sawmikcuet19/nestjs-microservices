import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TicketsService {
  private readonly ticketsServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.ticketsServiceUrl =
      process.env.TICKETS_SERVICE_URL || 'http://localhost:3004';
  }

  async purchase(purchaseTicketDto: any, userId: string) {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.ticketsServiceUrl}/purchase`,
        purchaseTicketDto,
        { headers: { 'x-user-id': userId } },
      ),
    );
    return response.data;
  }

  async findMyTickets(userId: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.ticketsServiceUrl}/my-tickets`, {
        headers: { 'x-user-id': userId },
      }),
    );
    return response.data;
  }

  async findOne(id: string, userId: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.ticketsServiceUrl}/${id}`, {
        headers: { 'x-user-id': userId },
      }),
    );
    return response.data;
  }

  async cancel(id: string, userId: string) {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.ticketsServiceUrl}/${id}/cancel`,
        {},
        { headers: { 'x-user-id': userId } },
      ),
    );
    return response.data;
  }

  async checkIn(checkInTicketDto: any, userId: string, userRole: string) {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.ticketsServiceUrl}/check-in`,
        checkInTicketDto,
        { headers: { 'x-user-id': userId, 'x-user-role': userRole } },
      ),
    );
    return response.data;
  }

  async findByEvent(eventId: string, userId: string, userRole: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.ticketsServiceUrl}/event/${eventId}`, {
        headers: { 'x-user-id': userId, 'x-user-role': userRole },
      }),
    );
    return response.data;
  }
}