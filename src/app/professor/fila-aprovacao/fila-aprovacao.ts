import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';
import { ApiService } from '../../services/api.service';
import { AuthService, UsuarioLogado } from '../../services/auth.service';

interface Projeto {
  id_projeto: number;
  id_turma: number;
  id_usuario_submissor: number;
  id_professor_orientador: number;
  titulo: string;
  descricao: string;
  problema: string | null;
  solucao: string | null;
  status: string;
  publicado: number;
  slug_publico: string | null;
  data_submissao: string | null;
  data_aprovacao: string | null;
  data_atualizacao: string | null;
}

interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
}

@Component({
  selector: 'app-fila-aprovacao',
  imports: [Sidebar, Topbar, RouterLink],
  templateUrl: './fila-aprovacao.html',
  styleUrl: './fila-aprovacao.css'
})
export class FilaAprovacao implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;

  projetos: Projeto[] = [];
  usuarios: Usuario[] = [];

  carregando = true;
  mensagemErro = '';
  mensagemSucesso = '';

  /*
    guarda o id do projeto que está sendo atualizado
    evita clicar várias vezes no mesmo botão
  */
  processandoId: number | null = null;

  filtroAtual: 'todos' | 'pendente' | 'revisao_solicitada' | 'aprovado' | 'rejeitado' = 'todos';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuarioLogado = this.authService.buscarUsuario();

    if (!this.usuarioLogado) {
      this.carregando = false;
      this.mensagemErro = 'Nenhum professor logado foi encontrado.';
      this.changeDetector.detectChanges();
      return;
    }

    this.carregarDados();
  }

  carregarDados(): void {
    this.carregando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    this.apiService.get<Projeto[]>('/projetos').subscribe({
      next: (projetosResposta) => {
        /*
          Mostra só projetos orientados pelo professor logado
        */
        this.projetos = projetosResposta.filter(
          (projeto) => projeto.id_professor_orientador === this.usuarioLogado?.id_usuario
        );

        this.carregarUsuarios();
      },

      error: (erro) => {
        this.carregando = false;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end. Verifique se o FastAPI está rodando.';
        } else {
          this.mensagemErro = `Erro ao carregar projetos. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  carregarUsuarios(): void {
    this.apiService.get<Usuario[]>('/usuarios').subscribe({
      next: (usuariosResposta) => {
        this.usuarios = usuariosResposta;
        this.carregando = false;
        this.changeDetector.detectChanges();
      },

      error: () => {
        /*
          Se os usuários não carregarem, a fila ainda pode funcionar
          Só não conseguira mostrar o nome do aluno
        */
        this.usuarios = [];
        this.carregando = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  mudarFiltro(filtro: 'todos' | 'pendente' | 'revisao_solicitada' | 'aprovado' | 'rejeitado'): void {
    this.filtroAtual = filtro;
  }

  get projetosFiltrados(): Projeto[] {
    if (this.filtroAtual === 'todos') {
      return this.projetos;
    }

    return this.projetos.filter((projeto) => projeto.status === this.filtroAtual);
  }

  get totalProjetos(): number {
    return this.projetos.length;
  }

  get totalPendentes(): number {
    return this.projetos.filter((projeto) => projeto.status === 'pendente').length;
  }

  get totalRevisao(): number {
    return this.projetos.filter((projeto) => projeto.status === 'revisao_solicitada').length;
  }

  get totalAprovados(): number {
    return this.projetos.filter((projeto) => projeto.status === 'aprovado').length;
  }

  get totalRejeitados(): number {
    return this.projetos.filter((projeto) => projeto.status === 'rejeitado').length;
  }

  nomeAluno(idUsuario: number): string {
    const usuario = this.usuarios.find((item) => item.id_usuario === idUsuario);

    if (!usuario) {
      return `Aluno #${idUsuario}`;
    }

    return usuario.nome;
  }

  aprovarProjeto(projeto: Projeto): void {
    this.atualizarStatusProjeto(projeto, 'aprovar');
  }

  solicitarRevisao(projeto: Projeto): void {
    this.atualizarStatusProjeto(projeto, 'solicitar-revisao');
  }

  rejeitarProjeto(projeto: Projeto): void {
    this.atualizarStatusProjeto(projeto, 'rejeitar');
  }

  atualizarStatusProjeto(
    projeto: Projeto,
    acao: 'aprovar' | 'solicitar-revisao' | 'rejeitar'
  ): void {
    this.processandoId = projeto.id_projeto;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    this.apiService
      .patch<Projeto>(`/projetos/${projeto.id_projeto}/${acao}`, {})
      .subscribe({
        next: (projetoAtualizado) => {
          /*
            Atualiza a lista local sem precisar recarregar a pag
          */
          this.projetos = this.projetos.map((item) => {
            if (item.id_projeto === projetoAtualizado.id_projeto) {
              return projetoAtualizado;
            }

            return item;
          });

          this.processandoId = null;

          if (acao === 'aprovar') {
            this.mensagemSucesso = 'Projeto aprovado com sucesso.';
          }

          if (acao === 'solicitar-revisao') {
            this.mensagemSucesso = 'Revisão solicitada com sucesso.';
          }

          if (acao === 'rejeitar') {
            this.mensagemSucesso = 'Projeto rejeitado com sucesso.';
          }

          this.changeDetector.detectChanges();
        },

        error: (erro) => {
          this.processandoId = null;

          if (erro.status === 0) {
            this.mensagemErro = 'Não foi possível conectar ao back-end.';
          } else {
            this.mensagemErro = `Erro ao atualizar projeto. Código: ${erro.status}`;
          }

          this.changeDetector.detectChanges();
        }
      });
  }

  podeAvaliar(projeto: Projeto): boolean {
    return projeto.status === 'pendente' || projeto.status === 'revisao_solicitada';
  }

  formatarStatus(status: string): string {
    if (status === 'aprovado') return 'Aprovado';
    if (status === 'pendente') return 'Pendente';
    if (status === 'revisao_solicitada') return 'Revisão Solicitada';
    if (status === 'rejeitado') return 'Rejeitado';

    return status;
  }

  classeStatus(status: string): string {
    if (status === 'aprovado') return 'approved';
    if (status === 'pendente') return 'pending';
    if (status === 'revisao_solicitada') return 'review';
    if (status === 'rejeitado') return 'rejected';

    return 'default';
  }

  formatarData(data: string | null): string {
    if (!data) {
      return '-';
    }

    return new Date(data).toLocaleDateString('pt-BR');
  }
}