import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

interface Avaliacao {
  id_avaliacao: number;
  id_projeto: number;
  id_versao: number;
  id_professor: number;
  parecer: string;
  status_resultante: string;
  nota_final: number | null;
  data_avaliacao: string | null;
}

interface VersaoProjeto {
  id_versao: number;
  id_projeto: number;
  numero_versao: number;
  descricao_alteracao: string | null;
  data_envio: string | null;
  status_versao: string;
}

/*
  Esse não vem  do back

  é só um modelo de tela, criado só para juntar:
  - dados do projeto
  - dados da avaliação
  - dados da ver avaliada

  o back não tem uma rota única de histórico, ai fizemos esse aqui rapidamente já que já tinha os endpoints necessarios 
*/
interface ItemHistorico {
  id_registro: number;
  projeto: Projeto;
  avaliacao: Avaliacao;
  versao: VersaoProjeto | null;
}

@Component({
  selector: 'app-professor-historico-revisoes',
  imports: [Sidebar, Topbar, RouterLink],
  templateUrl: './historico-revisoes.html',
  styleUrl: './historico-revisoes.css'
})
export class ProfessorHistoricoRevisoes implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;

  usuarios: Usuario[] = [];
  historico: ItemHistorico[] = [];

  carregando = true;
  mensagemErro = '';

  filtroAtual: 'todos' | 'aprovado' | 'revisao_solicitada' | 'rejeitado' = 'todos';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    /*
      Busca o professor salvo no login
      saber quais projetos pertencem a ele
    */
    this.usuarioLogado = this.authService.buscarUsuario();

    if (!this.usuarioLogado) {
      this.carregando = false;
      this.mensagemErro = 'Nenhum professor logado foi encontrado.';
      this.changeDetector.detectChanges();
      return;
    }

    this.carregarHistorico();
  }

  carregarHistorico(): void {
    this.carregando = true;
    this.mensagemErro = '';

    /*
      Primeiro busca projetos e usuários
      Os usuários servem para mostrar o nome do aluno em vez de só o ID
    */
    forkJoin({
      projetos: this.apiService.get<Projeto[]>('/projetos'),
      usuarios: this.apiService.get<Usuario[]>('/usuarios').pipe(
        catchError(() => of([] as Usuario[]))
      )
    }).subscribe({
      next: (respostaInicial) => {
        this.usuarios = respostaInicial.usuarios;

        const projetosDoProfessor = respostaInicial.projetos.filter(
          (projeto) => projeto.id_professor_orientador === this.usuarioLogado?.id_usuario
        );

        if (projetosDoProfessor.length === 0) {
          this.historico = [];
          this.carregando = false;
          this.changeDetector.detectChanges();
          return;
        }

        this.carregarAvaliacoesDosProjetos(projetosDoProfessor);
      },

      error: (erro) => {
        this.historico = [];
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

  carregarAvaliacoesDosProjetos(projetosDoProfessor: Projeto[]): void {
    /*
      o back lista avaliações por projeto, faz uma chamada para cada projeto
    */
    const requisicoesAvaliacoes = projetosDoProfessor.map((projeto) =>
      this.apiService.get<Avaliacao[]>(`/projetos/${projeto.id_projeto}/avaliacoes`).pipe(
        catchError(() => of([] as Avaliacao[]))
      )
    );

    /*
      Também busca as ver, porque a avaliação aponta para id_versao
      consegue mostrar "v1", "v2", etc. na tela
    */
    const requisicoesVersoes = projetosDoProfessor.map((projeto) =>
      this.apiService.get<VersaoProjeto[]>(`/projetos/${projeto.id_projeto}/versoes`).pipe(
        catchError(() => of([] as VersaoProjeto[]))
      )
    );

    forkJoin({
      avaliacoesPorProjeto: forkJoin(requisicoesAvaliacoes),
      versoesPorProjeto: forkJoin(requisicoesVersoes)
    }).subscribe({
      next: (resposta) => {
        const historicoMontado: ItemHistorico[] = [];

        projetosDoProfessor.forEach((projeto, index) => {
          const avaliacoesDoProjeto = resposta.avaliacoesPorProjeto[index];
          const versoesDoProjeto = resposta.versoesPorProjeto[index];

          avaliacoesDoProjeto.forEach((avaliacao) => {
            /*
              Encontra a ver avaliada para exibir um histórico mais claro
              Se por algum motivo não encontrar, não quebra a tela
            */
            const versaoAvaliada =
              versoesDoProjeto.find((versao) => versao.id_versao === avaliacao.id_versao) || null;

            historicoMontado.push({
              id_registro: avaliacao.id_avaliacao,
              projeto,
              avaliacao,
              versao: versaoAvaliada
            });
          });
        });

        /*
          Mostra as avaliações mais recentes primeiro
        */
        this.historico = historicoMontado.sort((a, b) => {
          const dataA = new Date(a.avaliacao.data_avaliacao || '').getTime() || 0;
          const dataB = new Date(b.avaliacao.data_avaliacao || '').getTime() || 0;

          if (dataA !== dataB) {
            return dataB - dataA;
          }

          return b.avaliacao.id_avaliacao - a.avaliacao.id_avaliacao;
        });

        this.carregando = false;
        this.changeDetector.detectChanges();
      },

      error: (erro) => {
        this.historico = [];
        this.carregando = false;
        this.mensagemErro = `Erro ao carregar avaliações. Código: ${erro.status}`;
        this.changeDetector.detectChanges();
      }
    });
  }

  mudarFiltro(filtro: 'todos' | 'aprovado' | 'revisao_solicitada' | 'rejeitado'): void {
    this.filtroAtual = filtro;
  }

  get historicoFiltrado(): ItemHistorico[] {
    if (this.filtroAtual === 'todos') {
      return this.historico;
    }

    return this.historico.filter(
      (item) => item.avaliacao.status_resultante === this.filtroAtual
    );
  }

  get totalAvaliacoes(): number {
    return this.historico.length;
  }

  get totalAprovadas(): number {
    return this.historico.filter(
      (item) => item.avaliacao.status_resultante === 'aprovado'
    ).length;
  }

  get totalRevisoes(): number {
    return this.historico.filter(
      (item) => item.avaliacao.status_resultante === 'revisao_solicitada'
    ).length;
  }

  get totalRejeitadas(): number {
    return this.historico.filter(
      (item) => item.avaliacao.status_resultante === 'rejeitado'
    ).length;
  }

  nomeAluno(idUsuario: number): string {
    const usuario = this.usuarios.find((item) => item.id_usuario === idUsuario);

    if (!usuario) {
      return `Aluno #${idUsuario}`;
    }

    return usuario.nome;
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
    if (status === 'revisao_solicitada') return 'review';
    if (status === 'rejeitado') return 'rejected';
    if (status === 'pendente') return 'pending';

    return 'default';
  }

  formatarData(data: string | null): string {
    if (!data) {
      return '-';
    }

    return new Date(data).toLocaleDateString('pt-BR');
  }

  formatarNota(nota: number | null): string {
    if (nota === null || nota === undefined) {
      return '-';
    }

    return String(nota);
  }

  textoVersao(item: ItemHistorico): string {
    if (!item.versao) {
      return `Versão #${item.avaliacao.id_versao}`;
    }

    return `v${item.versao.numero_versao}`;
  }
}