import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface UsuarioLogado {
  id_usuario: number;
  id_perfil: number;
  id_turma?: number | null;
  nome: string;
  email: string;
  status: string;
  perfil?: string;
  nome_perfil?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private apiService: ApiService) {}

  login(dados: LoginRequest): Observable<UsuarioLogado> {
    return this.apiService.post<UsuarioLogado>('/login', dados);
  }

  salvarUsuario(usuario: UsuarioLogado): void {
    localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
  }

  buscarUsuario(): UsuarioLogado | null {
    const usuarioSalvo = localStorage.getItem('usuarioLogado');

    if (!usuarioSalvo) {
      return null;
    }

    try {
      return JSON.parse(usuarioSalvo) as UsuarioLogado;
    } catch {
      localStorage.removeItem('usuarioLogado');
      return null;
    }
  }

  removerUsuario(): void {
    localStorage.removeItem('usuarioLogado');
  }

  sair(): void {
    this.removerUsuario();
  }

  estaLogado(): boolean {
    return this.buscarUsuario() !== null;
  }
}