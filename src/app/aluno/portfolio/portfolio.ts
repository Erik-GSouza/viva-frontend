import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';
import { ApiService } from '../../services/api.service';
import { AuthService, UsuarioLogado } from '../../services/auth.service';

/*
  Representa o portfólio do aluno

  O slug_publico é necessario pq ele será usado para abrir
  o portfólio público, por ex:
  /portfolio/aluno-teste
*/
interface Portfolio {
  id_portfolio: number;
  id_usuario: number;
  titulo?: string | null;
  bio?: string | null;
  slug_publico?: string | null;
  status?: string | null;
  data_criacao?: string | null;
  data_atualizacao?: string | null;
}

/*
  Representa a ligação entre portfólio e projeto.

  Essa tabela é o que define quais projetos o aluno escolheu mostrar
  no portfólio público dele
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
  Projeto completo vindo do back
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
  Integrante do projeto

  para descobrir quais projetos o aluno realmente participou,
  e não apenas quais ele submeteu
*/
interface IntegranteProjeto {
  id_integrante_projeto: number;
  id_usuario: number;
  id_projeto: number;
  funcao: string;
  data_vinculo?: string | null;
}

/*
  Junta a relação do portfólio com os dados completos do projeto
*/
interface ItemPortfolio {
  relacao: PortfolioProjeto;
  projeto: Projeto;
}

/*
  Projeto publicado em que o aluno participou mas que ainda não foi
  adicionado ao portfólio
*/
interface ProjetoDisponivel {
  projeto: Projeto;
  funcao: string;
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
  projetosDisponiveis: ProjetoDisponivel[] = [];

  carregando = true;
  mensagemErro = '';
  mensagemSucesso = '';

  /*
    Guarda o projeto que está sendo processado.
    evita clique duplo em add/remover enquanto o back responde
  */
  processandoId: number | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    /*
      Busca o usuário logado salvo no navegador
      Sem isso não daria pra saber qual portfólio carregar
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
    this.mensagemSucesso = '';

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
        this.carregarDadosDoPortfolio(portfolioResposta.id_portfolio);
      },

      error: (erro) => {
        this.carregando = false;
        this.portfolio = null;
        this.itensPortfolio = [];
        this.projetosDisponiveis = [];

        if (erro.status === 404) {
          this.mensagemErro = 'Nenhum portfólio foi encontrado para este aluno.';
        } else if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end. Verifique se o FastAPI está rodando.';
        } else {
          this.mensagemErro = `Erro ao carregar portfólio. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  carregarDadosDoPortfolio(idPortfolio: number): void {
    /*
      busca:
      - projetos que já estão no portfólio
      - todos os projetos cadastrados

      depois busca os integrantes dos projetos publicados para descobrir
      quais projetos o aluno pode add
    */
    forkJoin({
      relacoesPortfolio: this.apiService.get<PortfolioProjeto[]>(`/portfolios/${idPortfolio}/projetos`).pipe(
        catchError(() => of([] as PortfolioProjeto[]))
      ),

      projetos: this.apiService.get<Projeto[]>('/projetos').pipe(
        catchError(() => of([] as Projeto[]))
      )
    }).subscribe({
      next: (resposta) => {
        const projetosPublicados = resposta.projetos.filter((projeto) => {
          return projeto.publicado === 1 && projeto.status === 'aprovado';
        });

        if (projetosPublicados.length === 0) {
          this.montarListas(resposta.relacoesPortfolio, resposta.projetos, []);
          return;
        }

        /*
          Para saber se o aluno participou de cada projeto, usa o endpoint:
          GET /api/v1/projetos/{id_projeto}/integrantes
        */
        const buscasIntegrantes = projetosPublicados.map((projeto) =>
          this.apiService
            .get<IntegranteProjeto[]>(`/projetos/${projeto.id_projeto}/integrantes`)
            .pipe(catchError(() => of([] as IntegranteProjeto[])))
        );

        forkJoin(buscasIntegrantes).subscribe({
          next: (integrantesPorProjeto) => {
            const todosIntegrantes = integrantesPorProjeto.flat();

            this.montarListas(
              resposta.relacoesPortfolio,
              resposta.projetos,
              todosIntegrantes
            );
          },

          error: () => {
            /*
              Se não conseguir carregar integrantes, ainda mostramos o portfólio atual
              Só não mostra projetos disponíveis para adicionar
            */
            this.montarListas(resposta.relacoesPortfolio, resposta.projetos, []);
          }
        });
      },

      error: (erro) => {
        this.itensPortfolio = [];
        this.projetosDisponiveis = [];
        this.carregando = false;
        this.mensagemErro = `Erro ao carregar dados do portfólio. Código: ${erro.status}`;
        this.changeDetector.detectChanges();
      }
    });
  }

  montarListas(
    relacoesPortfolio: PortfolioProjeto[],
    projetos: Projeto[],
    integrantes: IntegranteProjeto[]
  ): void {
    const idUsuarioLogado = this.usuarioLogado?.id_usuario;

    /*
      Monta a lista de projetos que já estão no portfólio.
    */
    this.itensPortfolio = relacoesPortfolio
      .map((relacao) => {
        const projetoEncontrado = projetos.find(
          (projeto) => projeto.id_projeto === relacao.id_projeto
        );

        if (!projetoEncontrado) {
          return null;
        }

        return {
          relacao,
          projeto: projetoEncontrado
        };
      })
      .filter((item): item is ItemPortfolio => item !== null);

    const idsProjetosNoPortfolio = this.itensPortfolio.map(
      (item) => item.projeto.id_projeto
    );

    /*
      Monta a lista de projetos disponíveis para adicionar.

      Regras:
      - projeto precisa estar aprovado
      - projeto precisa estar publicado
      - aluno precisa estar entre os integrantes
      - projeto ainda não pode estar no portfólio dele
    */
    this.projetosDisponiveis = projetos
      .filter((projeto) => {
        const jaEstaNoPortfolio = idsProjetosNoPortfolio.includes(projeto.id_projeto);

        const integranteDoAluno = integrantes.find((integrante) => {
          return (
            integrante.id_projeto === projeto.id_projeto &&
            integrante.id_usuario === idUsuarioLogado
          );
        });

        return (
          projeto.status === 'aprovado' &&
          projeto.publicado === 1 &&
          !jaEstaNoPortfolio &&
          !!integranteDoAluno
        );
      })
      .map((projeto) => {
        const integranteDoAluno = integrantes.find((integrante) => {
          return (
            integrante.id_projeto === projeto.id_projeto &&
            integrante.id_usuario === idUsuarioLogado
          );
        });

        return {
          projeto,
          funcao: integranteDoAluno?.funcao || 'Participante'
        };
      });

    this.carregando = false;
    this.changeDetector.detectChanges();
  }

  adicionarAoPortfolio(item: ProjetoDisponivel): void {
    if (!this.portfolio) {
      this.mensagemErro = 'Portfólio não encontrado.';
      return;
    }

    this.processandoId = item.projeto.id_projeto;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    const dados = {
      id_projeto: item.projeto.id_projeto,
      ordem_exibicao: this.itensPortfolio.length + 1,
      destaque: 0
    };

    /*
      Endpoint:
      POST /api/v1/portfolios/{id_portfolio}/projetos
    */
    this.apiService
      .post<PortfolioProjeto>(`/portfolios/${this.portfolio.id_portfolio}/projetos`, dados)
      .subscribe({
        next: () => {
          this.processandoId = null;
          this.mensagemSucesso = 'Projeto adicionado ao portfólio público.';
          this.carregarPortfolio();
        },

        error: (erro) => {
          this.processandoId = null;

          if (erro.status === 0) {
            this.mensagemErro = 'Não foi possível conectar ao back-end.';
          } else {
            this.mensagemErro = `Erro ao adicionar projeto ao portfólio. Código: ${erro.status}`;
          }

          this.changeDetector.detectChanges();
        }
      });
  }

  removerDoPortfolio(item: ItemPortfolio): void {
    if (!this.portfolio) {
      this.mensagemErro = 'Portfólio não encontrado.';
      return;
    }

    const confirmar = window.confirm(
      `Deseja remover "${item.projeto.titulo}" do seu portfólio público?`
    );

    if (!confirmar) {
      return;
    }

    this.processandoId = item.projeto.id_projeto;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    /*
      Endpoint:
      DELETE /api/v1/portfolios/{id_portfolio}/projetos/{id_portfolio_projeto}
    */
    this.apiService
      .delete<unknown>(
        `/portfolios/${this.portfolio.id_portfolio}/projetos/${item.relacao.id_portfolio_projeto}`
      )
      .subscribe({
        next: () => {
          this.processandoId = null;
          this.mensagemSucesso = 'Projeto removido do portfólio público.';
          this.carregarPortfolio();
        },

        error: (erro) => {
          this.processandoId = null;

          if (erro.status === 0) {
            this.mensagemErro = 'Não foi possível conectar ao back-end.';
          } else {
            this.mensagemErro = `Erro ao remover projeto do portfólio. Código: ${erro.status}`;
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

  formatarData(data: string | null | undefined): string {
    if (!data) {
      return '-';
    }

    return new Date(data).toLocaleDateString('pt-BR');
  }
}