import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/*
  Service base da API

  Ele centraliza a URL do back-end e evita que repita
  http://127.0.0.1:8000/api/v1 em varios arquivos
*/
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://127.0.0.1:8000/api/v1';

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${endpoint}`);
  }

  post<T>(endpoint: string, dados: unknown): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, dados);
  }

  put<T>(endpoint: string, dados: unknown): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, dados);
  }

  patch<T>(endpoint: string, dados: unknown): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${endpoint}`, dados);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`);
  }
}