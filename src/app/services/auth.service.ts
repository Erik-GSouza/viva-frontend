import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface LoginRequest {
  email: string;
  senha: string;
}


export interface UsuarioLogado {
  id_usuario: number;
  nome: string;
  email: string;
  status: string;
  id_perfil?: number;
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

    return JSON.parse(usuarioSalvo);
  }

  sair(): void {
    localStorage.removeItem('usuarioLogado');
  }
}