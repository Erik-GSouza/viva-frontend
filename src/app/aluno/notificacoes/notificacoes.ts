import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';
import { ApiService } from '../../services/api.service';
import { AuthService, UsuarioLogado } from '../../services/auth.service';

/*
  Representa uma notificação retornada pelo back-end

  Alguns campos estão como opcionais pq o back pode retornar
  nomes diferentes dependendo da modelagem final
*/
interface Notificacao {
  id_notificacao: number;
  id_usuario: number;
  titulo: string;
  mensagem: string;
  tipo?: string | null;
  lida: number | boolean;
  data_criacao?: string | null;
  data_envio?: string | null;
  data_leitura?: string | null;
}

@Component({
  selector: 'app-aluno-notificacoes',
  imports: [Sidebar, Topbar],
  templateUrl: './notificacoes.html',
  styleUrl: './notificacoes.css'
})
export class AlunoNotificacoes implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;

  notificacoes: Notificacao[] = [];

  carregando = true;
  mensagemErro = '';
  marcandoId: number | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    /*
      Primeiro busca o usuario salvo no login
    */
    this.usuarioLogado = this.authService.buscarUsuario();

    if (!this.usuarioLogado) {
      this.carregando = false;
      this.mensagemErro = 'Nenhum usuário logado foi encontrado.';
      this.changeDetector.detectChanges();
      return;
    }

    this.carregarNotificacoes();
  }

  carregarNotificacoes(): void {
    this.carregando = true;
    this.mensagemErro = '';

    const idUsuario = this.usuarioLogado?.id_usuario;

    if (!idUsuario) {
      this.carregando = false;
      this.mensagemErro = 'Não foi possível identificar o usuário logado.';
      this.changeDetector.detectChanges();
      return;
    }

    /*
      Endpoint do back:

      GET /api/v1/usuarios/{id_usuario}/notificacoes
    */
    this.apiService.get<Notificacao[]>(`/usuarios/${idUsuario}/notificacoes`).subscribe({
      next: (resposta) => {
        if (!Array.isArray(resposta)) {
          this.notificacoes = [];
          this.carregando = false;
          this.mensagemErro = 'A resposta de notificações veio em um formato inesperado.';
          this.changeDetector.detectChanges();
          return;
        }

        this.notificacoes = resposta;
        this.carregando = false;
        this.changeDetector.detectChanges();
      },

      error: (erro) => {
        this.notificacoes = [];
        this.carregando = false;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end. Verifique se o FastAPI está rodando.';
        } else {
          this.mensagemErro = `Erro ao carregar notificações. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  marcarComoLida(notificacao: Notificacao): void {
    if (this.notificacaoLida(notificacao)) {
      return;
    }

    this.marcandoId = notificacao.id_notificacao;

    /*
      Endpoint do back:

      PATCH /api/v1/notificacoes/{id_notificacao}/marcar-como-lida
    */
    this.apiService
      .patch<Notificacao>(`/notificacoes/${notificacao.id_notificacao}/marcar-como-lida`, {})
      .subscribe({
        next: () => {
          /*
            Atualiza a notificação na própria tela,
            sem precisar recarregar a página inteira
          */
          this.notificacoes = this.notificacoes.map((item) => {
            if (item.id_notificacao === notificacao.id_notificacao) {
              return {
                ...item,
                lida: true
              };
            }

            return item;
          });

          this.marcandoId = null;
          this.changeDetector.detectChanges();
        },

        error: (erro) => {
          this.marcandoId = null;
          this.mensagemErro = `Erro ao marcar notificação como lida. Código: ${erro.status}`;
          this.changeDetector.detectChanges();
        }
      });
  }

  notificacaoLida(notificacao: Notificacao): boolean {
    return notificacao.lida === true || notificacao.lida === 1;
  }

  get totalNotificacoes(): number {
    return this.notificacoes.length;
  }

  get totalNaoLidas(): number {
    return this.notificacoes.filter((notificacao) => !this.notificacaoLida(notificacao)).length;
  }

  get totalLidas(): number {
    return this.notificacoes.filter((notificacao) => this.notificacaoLida(notificacao)).length;
  }

  iconePorTipo(tipo?: string | null): string {
    if (tipo === 'aprovacao') {
      return 'bi-check-circle';
    }

    if (tipo === 'revisao') {
      return 'bi-arrow-repeat';
    }

    if (tipo === 'rejeicao') {
      return 'bi-x-circle';
    }

    if (tipo === 'publicacao') {
      return 'bi-globe2';
    }

    return 'bi-bell';
  }

  classePorTipo(tipo?: string | null): string {
    if (tipo === 'aprovacao') {
      return 'success';
    }

    if (tipo === 'revisao') {
      return 'info';
    }

    if (tipo === 'rejeicao') {
      return 'danger';
    }

    if (tipo === 'publicacao') {
      return 'primary';
    }

    return 'default';
  }

  formatarData(notificacao: Notificacao): string {
    const data = notificacao.data_criacao || notificacao.data_envio;

    if (!data) {
      return '-';
    }

    return new Date(data).toLocaleDateString('pt-BR');
  }
}