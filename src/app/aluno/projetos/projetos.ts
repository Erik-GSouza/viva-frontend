import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';
import { ApiService } from '../../services/api.service';
import { AuthService, UsuarioLogado } from '../../services/auth.service';

/*
  representa um projeto vindo do back

  segue os campos do FastAPI
*/
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

@Component({
  selector: 'app-aluno-projetos',
  imports: [Sidebar, Topbar],
  templateUrl: './projetos.html',
  styleUrl: './projetos.css'
})
export class AlunoProjetos implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;
  projetos: Projeto[] = [];

  mensagemErro = '';
  carregando = true;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    /*
      Primeiro busca o usuario salvo no navegador depois do login
    */
    this.usuarioLogado = this.authService.buscarUsuario();

    if (!this.usuarioLogado) {
      this.carregando = false;
      this.mensagemErro = 'Nenhum usuário logado foi encontrado.';

      /*
        Força a tela a atualizar depois da mudança
      */
      this.changeDetector.detectChanges();
      return;
    }

    this.carregarProjetos();
  }

  carregarProjetos(): void {
    this.carregando = true;
    this.mensagemErro = '';

    this.apiService.get<Projeto[]>('/projetos').subscribe({
      next: (resposta) => {
        if (!Array.isArray(resposta)) {
          this.projetos = [];
          this.carregando = false;
          this.mensagemErro = 'A resposta de projetos veio em um formato inesperado.';

          this.changeDetector.detectChanges();
          return;
        }

        const idUsuarioLogado = this.usuarioLogado?.id_usuario;

        if (!idUsuarioLogado) {
          this.projetos = [];
          this.carregando = false;
          this.mensagemErro = 'Não foi possível identificar o usuário logado.';

          this.changeDetector.detectChanges();
          return;
        }

        /*
          Filtra apenas os projetos enviados pelo aluno logado
        */
        this.projetos = resposta.filter(
          (projeto) => projeto.id_usuario_submissor === idUsuarioLogado
        );

        this.carregando = false;

        /*
          força o Angular a refletir na tela que carregando virou false
          e que a lista de projetos foi preenchida
        */
        this.changeDetector.detectChanges();
      },

      error: (erro) => {
        this.carregando = false;
        this.projetos = [];

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end. Verifique se o FastAPI está rodando.';
        } else {
          this.mensagemErro = `Erro ao carregar projetos. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  get totalProjetos(): number {
    return this.projetos.length;
  }

  get totalAprovados(): number {
    return this.projetos.filter((projeto) => projeto.status === 'aprovado').length;
  }

  get totalPendentes(): number {
    return this.projetos.filter((projeto) => projeto.status === 'pendente').length;
  }

  get totalRevisao(): number {
    return this.projetos.filter((projeto) => projeto.status === 'revisao_solicitada').length;
  }

  get totalRejeitados(): number {
    return this.projetos.filter((projeto) => projeto.status === 'rejeitado').length;
  }

  formatarStatus(status: string): string {
    if (status === 'aprovado') {
      return 'Aprovado';
    }

    if (status === 'pendente') {
      return 'Pendente';
    }

    if (status === 'revisao_solicitada') {
      return 'Revisão Solicitada';
    }

    if (status === 'rejeitado') {
      return 'Rejeitado';
    }

    return status;
  }

  classeStatus(status: string): string {
    if (status === 'aprovado') {
      return 'approved';
    }

    if (status === 'pendente') {
      return 'pending';
    }

    if (status === 'revisao_solicitada') {
      return 'review';
    }

    if (status === 'rejeitado') {
      return 'rejected';
    }

    return 'default';
  }

  formatarData(data: string | null): string {
    if (!data) {
      return '-';
    }

    return new Date(data).toLocaleDateString('pt-BR');
  }
}