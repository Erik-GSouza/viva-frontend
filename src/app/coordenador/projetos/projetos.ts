import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  id_perfil: number;
  id_turma?: number | null;
  nome: string;
  email: string;
}

interface Turma {
  id_turma: number;
  id_curso: number;
  nome: string;
  semestre: string;
  ano: number;
  turno: string;
  status: string;
}

interface Curso {
  id_curso: number;
  nome: string;
  sigla: string;
  descricao?: string | null;
  status: string;
}

type FiltroProjeto =
  | 'todos'
  | 'pendente'
  | 'aprovado'
  | 'revisao_solicitada'
  | 'rejeitado'
  | 'publicado'
  | 'nao_publicado';

@Component({
  selector: 'app-coordenador-projetos',
  imports: [Sidebar, Topbar, FormsModule],
  templateUrl: './projetos.html',
  styleUrl: './projetos.css'
})
export class CoordenadorProjetos implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;

  projetos: Projeto[] = [];
  usuarios: Usuario[] = [];
  turmas: Turma[] = [];
  cursos: Curso[] = [];

  carregando = true;
  mensagemErro = '';
  mensagemSucesso = '';

  filtroAtual: FiltroProjeto = 'todos';
  termoBusca = '';

  /*
    Guarda o ID do projeto que está sendo publicado.
    evita clique duplo enquanto o back responde.
  */
  publicandoId: number | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    /*
      Pega o coordenador salvo no login
      ai a topbar mostra o nome real do usuário logado
    */
    this.usuarioLogado = this.authService.buscarUsuario();

    if (!this.usuarioLogado) {
      this.carregando = false;
      this.mensagemErro = 'Nenhum coordenador logado foi encontrado.';
      this.changeDetector.detectChanges();
      return;
    }

    this.carregarDados();
  }

  carregarDados(): void {
    this.carregando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    /*
      endpoints

      /projetos traz os projetos
      /usuarios ajuda a mostrar nomes de aluno e orientador
      /turmas e /cursos ajudam a mostrar o curso do projeto
    */
    forkJoin({
      projetos: this.apiService.get<Projeto[]>('/projetos'),
      usuarios: this.apiService.get<Usuario[]>('/usuarios').pipe(
        catchError(() => of([] as Usuario[]))
      ),
      turmas: this.apiService.get<Turma[]>('/turmas').pipe(
        catchError(() => of([] as Turma[]))
      ),
      cursos: this.apiService.get<Curso[]>('/cursos').pipe(
        catchError(() => of([] as Curso[]))
      )
    }).subscribe({
      next: (resposta) => {
        this.projetos = resposta.projetos;
        this.usuarios = resposta.usuarios;
        this.turmas = resposta.turmas;
        this.cursos = resposta.cursos;

        this.carregando = false;
        this.changeDetector.detectChanges();
      },

      error: (erro) => {
        this.projetos = [];
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

  mudarFiltro(filtro: FiltroProjeto): void {
    this.filtroAtual = filtro;
  }

  get projetosFiltrados(): Projeto[] {
    let lista = this.projetos.slice();

    if (this.filtroAtual === 'publicado') {
      lista = lista.filter((projeto) => projeto.publicado === 1);
    } else if (this.filtroAtual === 'nao_publicado') {
      lista = lista.filter((projeto) => projeto.publicado !== 1);
    } else if (this.filtroAtual !== 'todos') {
      lista = lista.filter((projeto) => projeto.status === this.filtroAtual);
    }

    const busca = this.termoBusca.trim().toLowerCase();

    if (busca.length > 0) {
      lista = lista.filter((projeto) => {
        const aluno = this.nomeUsuario(projeto.id_usuario_submissor).toLowerCase();
        const orientador = this.nomeUsuario(projeto.id_professor_orientador).toLowerCase();
        const curso = this.nomeCursoPorTurma(projeto.id_turma).toLowerCase();

        return (
          projeto.titulo.toLowerCase().includes(busca) ||
          projeto.descricao.toLowerCase().includes(busca) ||
          aluno.includes(busca) ||
          orientador.includes(busca) ||
          curso.includes(busca)
        );
      });
    }

    return lista.sort((a, b) => {
      const dataA = new Date(a.data_submissao || '').getTime() || 0;
      const dataB = new Date(b.data_submissao || '').getTime() || 0;

      return dataB - dataA;
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

  get totalPublicados(): number {
    return this.projetos.filter((projeto) => projeto.publicado === 1).length;
  }

  publicarProjeto(projeto: Projeto): void {
    /*
      o coordenador só deve publicar projeto que já foi aprovado
      o back publica pelo endpoint, mas aqui o front evita publicar algo pendente sem querer
    */
    if (projeto.status !== 'aprovado') {
      this.mensagemErro = 'Somente projetos aprovados podem ser publicados na vitrine.';
      return;
    }

    if (projeto.publicado === 1) {
      this.mensagemErro = 'Este projeto já está publicado.';
      return;
    }

    const confirmar = window.confirm(
      `Deseja publicar o projeto "${projeto.titulo}" na vitrine pública?`
    );

    if (!confirmar) {
      return;
    }

    this.publicandoId = projeto.id_projeto;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    /*
      Endpoint do back:
      PATCH /api/v1/projetos/{id_projeto}/publicar

      Ele marca publicado = 1 e mantém/define o status como aprovado
    */
    this.apiService
      .patch<Projeto>(`/projetos/${projeto.id_projeto}/publicar`, {})
      .subscribe({
        next: (projetoAtualizado) => {
          this.projetos = this.projetos.map((item) => {
            if (item.id_projeto === projetoAtualizado.id_projeto) {
              return projetoAtualizado;
            }

            return item;
          });

          this.publicandoId = null;
          this.mensagemSucesso = 'Projeto publicado na vitrine com sucesso.';

          /*
            Avisa o aluno que o projeto foi publicado.
            Se a notificação falhar, a publicação continua válida, porque o projeto
            já foi atualizado no back
          */
          this.criarNotificacaoParaAluno(projetoAtualizado);

          this.changeDetector.detectChanges();
        },

        error: (erro) => {
          this.publicandoId = null;

          if (erro.status === 0) {
            this.mensagemErro = 'Não foi possível conectar ao back-end.';
          } else {
            this.mensagemErro = `Erro ao publicar projeto. Código: ${erro.status}`;
          }

          this.changeDetector.detectChanges();
        }
      });
  }

  criarNotificacaoParaAluno(projeto: Projeto): void {
    const dadosNotificacao = {
      id_usuario: projeto.id_usuario_submissor,
      titulo: 'Projeto publicado na vitrine',
      mensagem: `Seu projeto "${projeto.titulo}" foi publicado na vitrine pública do VIVA.`,
      tipo: 'publicacao',
      lida: 0,
      link_destino: `/aluno/projetos/${projeto.id_projeto}`
    };

    this.apiService.post<unknown>('/notificacoes', dadosNotificacao).subscribe({
      next: () => {
      },

      error: () => {
        /*
          Não trav a publicação se a notificação falhar.
        */
      }
    });
  }

  podePublicar(projeto: Projeto): boolean {
    return projeto.status === 'aprovado' && projeto.publicado !== 1;
  }

  nomeUsuario(idUsuario: number): string {
    const usuario = this.usuarios.find((item) => item.id_usuario === idUsuario);

    if (!usuario) {
      return `Usuário #${idUsuario}`;
    }

    return usuario.nome;
  }

  nomeCursoPorTurma(idTurma: number): string {
    const turma = this.turmas.find((item) => item.id_turma === idTurma);

    if (!turma) {
      return '-';
    }

    const curso = this.cursos.find((item) => item.id_curso === turma.id_curso);

    if (!curso) {
      return turma.nome;
    }

    return curso.sigla;
  }

  semestrePorTurma(idTurma: number): string {
    const turma = this.turmas.find((item) => item.id_turma === idTurma);

    if (!turma) {
      return '-';
    }

    return `${turma.semestre} · ${turma.ano}`;
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

  publicadoTexto(publicado: number): string {
    return publicado === 1 ? 'Publicado' : 'Não publicado';
  }

  classePublicado(publicado: number): string {
    return publicado === 1 ? 'published' : 'not-published';
  }

  formatarData(data: string | null): string {
    if (!data) {
      return '-';
    }

    return new Date(data).toLocaleDateString('pt-BR');
  }
}