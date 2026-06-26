import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';
import { ApiService } from '../../services/api.service';
import { AuthService, UsuarioLogado } from '../../services/auth.service';

/*
  interface notificação do back
*/
interface Notificacao {
  id_notificacao: number;
  id_usuario: number;
  titulo: string;
  mensagem: string;
  tipo?: string | null;
  lida: number | boolean;
  link_destino?: string | null;
  data_criacao?: string | null;
  data_envio?: string | null;
  data_leitura?: string | null;
}

@Component({
  selector: 'app-professor-notificacoes',
  imports: [Sidebar, Topbar, RouterLink],
  templateUrl: './notificacoes.html',
  styleUrl: './notificacoes.css'
})
export class ProfessorNotificacoes implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;

  notificacoes: Notificacao[] = [];

  carregando = true;
  mensagemErro = '';

  /*
    Guarda o ID da notificação que está sendo marcada como lida
    evita clicar várias vezes no mesmo botão enquanto o back responde
  */
  marcandoId: number | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    /*
      Primeiro busca o professor que foi salvo no localStorage no login
    */
    this.usuarioLogado = this.authService.buscarUsuario();

    if (!this.usuarioLogado) {
      this.carregando = false;
      this.mensagemErro = 'Nenhum professor logado foi encontrado.';
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
      this.mensagemErro = 'Não foi possível identificar o professor logado.';
      this.changeDetector.detectChanges();
      return;
    }

    /*
      Endpoint:
      GET /api/v1/usuarios/{id_usuario}/notificacoes

      que nem o aluno mas esta buscando as notificações do professor
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
    /*
      Se a notificação já está lida, não precisa chamar o back de novo
    */
    if (this.notificacaoLida(notificacao)) {
      return;
    }

    this.marcandoId = notificacao.id_notificacao;
    this.mensagemErro = '';

    /*
      Endpoint:
      PATCH /api/v1/notificacoes/{id_notificacao}/marcar-como-lida
    */
    this.apiService
      .patch<Notificacao>(`/notificacoes/${notificacao.id_notificacao}/marcar-como-lida`, {})
      .subscribe({
        next: () => {
          /*
            Att a lista na própria tela
            Assim o professor vê a mudança sem precisar att a pag
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

          if (erro.status === 0) {
            this.mensagemErro = 'Não foi possível conectar ao back-end.';
          } else {
            this.mensagemErro = `Erro ao marcar notificação como lida. Código: ${erro.status}`;
          }

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
    if (tipo === 'avaliacao') return 'bi-clipboard-check';
    if (tipo === 'revisao') return 'bi-arrow-repeat';
    if (tipo === 'aprovacao') return 'bi-check-circle';
    if (tipo === 'publicacao') return 'bi-globe2';

    return 'bi-bell';
  }

  classePorTipo(tipo?: string | null): string {
    if (tipo === 'avaliacao') return 'primary';
    if (tipo === 'revisao') return 'info';
    if (tipo === 'aprovacao') return 'success';
    if (tipo === 'publicacao') return 'primary';

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