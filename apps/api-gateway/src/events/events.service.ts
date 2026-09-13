import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EventsService {
  private readonly eventsServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.eventsServiceUrl =
      process.env.EVENTS_SERVICE_URL || 'http://localhost:3003';
  }

  async create(createEventDto: any, userId: string, userRole: string) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.eventsServiceUrl}`, createEventDto, {
        headers: { 'x-user-id': userId, 'x-user-role': userRole },
      }),
    );
    return response.data;
  }

  async findAll() {
    const response = await firstValueFrom(
      this.httpService.get(`${this.eventsServiceUrl}`),
    );
    return response.data;
  }

  async findOne(id: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.eventsServiceUrl}/${id}`),
    );
    return response.data;
  }

  async findMyEvents(userId: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.eventsServiceUrl}/my-events`, {
        headers: { 'x-user-id': userId },
      }),
    );
    return response.data;
  }

  async update(id: string, updateEventDto: any, userId: string, userRole: string) {
    const response = await firstValueFrom(
      this.httpService.put(`${this.eventsServiceUrl}/${id}`, updateEventDto, {
        headers: { 'x-user-id': userId, 'x-user-role': userRole },
      }),
    );
    return response.data;
  }

  async publish(id: string, userId: string, userRole: string) {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.eventsServiceUrl}/${id}/publish`,
        {},
        { headers: { 'x-user-id': userId, 'x-user-role': userRole } },
      ),
    );
    return response.data;
  }

  async cancel(id: string, userId: string, userRole: string) {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.eventsServiceUrl}/${id}/cancel`,
        {},
        { headers: { 'x-user-id': userId, 'x-user-role': userRole } },
      ),
    );
    return response.data;
  }
}