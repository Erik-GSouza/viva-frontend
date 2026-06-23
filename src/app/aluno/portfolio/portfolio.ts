import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';
import { ApiService } from '../../services/api.service';
import { AuthService, UsuarioLogado } from '../../services/auth.service';

/*
  Representa o portfólio do aluno
*/
interface Portfolio {
  id_portfolio: number;
  id_usuario: number;
  titulo?: string | null;
  descricao?: string | null;
  data_criacao?: string | null;
  data_atualizacao?: string | null;
}

/*
  Representa a ligação entre portfolio e projeto

  O back normalmente retorna o id do projeto dentro dessa relação
*/
interface PortfolioProjeto {
  id_portfolio_projeto: number;
  id_portfolio: number;
  id_projeto: number;
  destaque?: number | boolean;
  ordem_exibicao?: number | null;
  data_adicao?: string | null;
}

/*
  Representa o projeto completo vindo do back
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

/*
  Esse tipo junta a relação do portfólio com os dados completos do projeto
*/
interface ItemPortfolio {
  relacao: PortfolioProjeto;
  projeto: Projeto;
}

@Component({
  selector: 'app-aluno-portfolio',
  imports: [Sidebar, Topbar, RouterLink],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.css'
})
export class AlunoPortfolio implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;

  portfolio: Portfolio | null = null;
  itensPortfolio: ItemPortfolio[] = [];

  carregando = true;
  mensagemErro = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    /*
      Busca o usuario logado salvo no navegador
    */
    this.usuarioLogado = this.authService.buscarUsuario();

    if (!this.usuarioLogado) {
      this.carregando = false;
      this.mensagemErro = 'Nenhum usuário logado foi encontrado.';
      this.changeDetector.detectChanges();
      return;
    }

    this.carregarPortfolio();
  }

  carregarPortfolio(): void {
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
      Endpoint:
      GET /api/v1/usuarios/{id_usuario}/portfolio
    */
    this.apiService.get<Portfolio>(`/usuarios/${idUsuario}/portfolio`).subscribe({
      next: (portfolioResposta) => {
        this.portfolio = portfolioResposta;
        this.carregarProjetosDoPortfolio(portfolioResposta.id_portfolio);
      },

      error: (erro) => {
        this.carregando = false;
        this.portfolio = null;
        this.itensPortfolio = [];

        if (erro.status === 404) {
          this.mensagemErro = '';
        } else if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end. Verifique se o FastAPI está rodando.';
        } else {
          this.mensagemErro = `Erro ao carregar portfólio. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  carregarProjetosDoPortfolio(idPortfolio: number): void {
    /*
      Endpoint:
      GET /api/v1/portfolios/{id_portfolio}/projetos
    */
    this.apiService.get<PortfolioProjeto[]>(`/portfolios/${idPortfolio}/projetos`).subscribe({
      next: (relacoes) => {
        if (!Array.isArray(relacoes) || relacoes.length === 0) {
          this.itensPortfolio = [];
          this.carregando = false;
          this.changeDetector.detectChanges();
          return;
        }

        /*
          Para cada projeto ligado ao portfolio, busca os dados completos dele
          Assim a tela mostra titulo, descriçao, status e datas
        */
        const buscasProjetos = relacoes.map((relacao) =>
          this.apiService.get<Projeto>(`/projetos/${relacao.id_projeto}`)
        );

        forkJoin(buscasProjetos).subscribe({
          next: (projetos) => {
            this.itensPortfolio = relacoes.map((relacao, index) => {
              return {
                relacao,
                projeto: projetos[index]
              };
            });

            this.carregando = false;
            this.changeDetector.detectChanges();
          },

          error: (erro) => {
            this.itensPortfolio = [];
            this.carregando = false;
            this.mensagemErro = `Erro ao carregar projetos do portfólio. Código: ${erro.status}`;
            this.changeDetector.detectChanges();
          }
        });
      },

      error: (erro) => {
        this.itensPortfolio = [];
        this.carregando = false;

        if (erro.status === 404) {
          this.mensagemErro = '';
        } else {
          this.mensagemErro = `Erro ao carregar projetos do portfólio. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  get totalProjetos(): number {
    return this.itensPortfolio.length;
  }

  get totalDestaques(): number {
    return this.itensPortfolio.filter((item) => this.ehDestaque(item.relacao)).length;
  }

  get totalPublicados(): number {
    return this.itensPortfolio.filter((item) => item.projeto.publicado === 1).length;
  }

  ehDestaque(relacao: PortfolioProjeto): boolean {
    return relacao.destaque === true || relacao.destaque === 1;
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

  formatarData(data: string | null | undefined): string {
    if (!data) {
      return '-';
    }

    return new Date(data).toLocaleDateString('pt-BR');
  }
}