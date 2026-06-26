import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';
import { ApiService } from '../../services/api.service';
import { AuthService, UsuarioLogado } from '../../services/auth.service';
import { RouterLink } from '@angular/router';

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

interface VersaoProjeto {
  id_versao: number;
  id_projeto: number;
  numero_versao: number;
  descricao_alteracao: string | null;
  data_envio: string | null;
  status_versao: string;
}

@Component({
  selector: 'app-aluno-projetos',
  imports: [Sidebar, Topbar, RouterLink],
  templateUrl: './projetos.html',
  styleUrl: './projetos.css'
})
export class AlunoProjetos implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;
  projetos: Projeto[] = [];

  mensagemErro = '';
  mensagemSucesso = '';
  carregando = true;

  /*
    Guarda o ID do projeto que está sendo reenviado
    evita o aluno clicar várias vezes no botão enquanto o back processa
  */
  reenviandoId: number | null = null;

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

  reenviarProjeto(projeto: Projeto): void {
    /*
      Regra do fluxo:
      só faz sentido reenviar quando o professor solicitou revisão
    */
    if (projeto.status !== 'revisao_solicitada') {
      this.mensagemErro = 'Este projeto não está aguardando reenvio.';
      return;
    }

    /*
      Esse texto vai para o campo descricao_alteracao da nova ver
      O aluno pode explicar rapidamente o que corrigiu
    */
    const descricaoDigitada = window.prompt(
      'Descreva rapidamente o que foi ajustado nesta nova versão:',
      'Projeto reenviado após solicitação de revisão.'
    );

    /*
      Se o aluno clicar em Cancelar, vai parar a ação
    */
    if (descricaoDigitada === null) {
      return;
    }

    const descricaoReenvio =
      descricaoDigitada.trim() || 'Projeto reenviado após solicitação de revisão.';

    this.reenviandoId = projeto.id_projeto;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    /*
      Primeiro buscam as versões atuais para descobrir qual será o próx num
      Ex:
      se já existe v1, o reenvio vira v2
    */
    this.apiService.get<VersaoProjeto[]>(`/projetos/${projeto.id_projeto}/versoes`).subscribe({
      next: (versoes) => {
        const maiorNumeroVersao = versoes.reduce((maior, versao) => {
          return Math.max(maior, versao.numero_versao);
        }, 0);

        const dadosNovaVersao = {
          numero_versao: maiorNumeroVersao + 1,
          descricao_alteracao: descricaoReenvio,
          status_versao: 'submetida'
        };

        /*
          Cria a nova versão usando o endpoint:
          POST /api/v1/projetos/{id_projeto}/versoes
        */
        this.apiService
          .post<VersaoProjeto>(`/projetos/${projeto.id_projeto}/versoes`, dadosNovaVersao)
          .subscribe({
            next: () => {
              this.colocarProjetoComoPendente(projeto);
            },

            error: (erro) => {
              this.reenviandoId = null;

              if (erro.status === 0) {
                this.mensagemErro = 'Não foi possível conectar ao back-end.';
              } else {
                this.mensagemErro = `Erro ao criar nova versão. Código: ${erro.status}`;
              }

              this.changeDetector.detectChanges();
            }
          });
      },

      error: (erro) => {
        this.reenviandoId = null;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end.';
        } else {
          this.mensagemErro = `Erro ao buscar versões do projeto. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  colocarProjetoComoPendente(projeto: Projeto): void {
    /*
      Depois de criar a nova ver, o projeto precisa voltar para pendente
      Ai ele retorna para a fila de aprovação do professor
    */
    this.apiService
      .patch<Projeto>(`/projetos/${projeto.id_projeto}/status`, {
        status: 'pendente'
      })
      .subscribe({
        next: (projetoAtualizado) => {
          this.projetos = this.projetos.map((item) => {
            if (item.id_projeto === projetoAtualizado.id_projeto) {
              return projetoAtualizado;
            }

            return item;
          });

          this.reenviandoId = null;
          this.mensagemSucesso = 'Projeto reenviado com sucesso. Ele voltou para a fila do professor.';

          /*
            uma notificação  para o professor orientador
            Se essa notificação falhar, o reenvio continua válido, porque a nova ver
            e o status do projeto já foram salvos
          */
          this.criarNotificacaoParaProfessor(projetoAtualizado);

          this.changeDetector.detectChanges();
        },

        error: (erro) => {
          this.reenviandoId = null;

          if (erro.status === 0) {
            this.mensagemErro = 'Não foi possível conectar ao back-end.';
          } else {
            this.mensagemErro = `A nova versão foi criada, mas houve erro ao atualizar o status. Código: ${erro.status}`;
          }

          this.changeDetector.detectChanges();
        }
      });
  }

  criarNotificacaoParaProfessor(projeto: Projeto): void {
    const dadosNotificacao = {
      id_usuario: projeto.id_professor_orientador,
      titulo: 'Projeto reenviado para avaliação',
      mensagem: `O projeto "${projeto.titulo}" foi reenviado pelo aluno e está aguardando nova avaliação.`,
      tipo: 'avaliacao',
      lida: 0,
      link_destino: `/professor/projetos/${projeto.id_projeto}`
    };

    this.apiService.post<unknown>('/notificacoes', dadosNotificacao).subscribe({
      next: () => {
      },

      error: () => {
      }
    });
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