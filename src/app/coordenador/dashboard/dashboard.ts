import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';
import { ApiService } from '../../services/api.service';
import { AuthService, UsuarioLogado } from '../../services/auth.service';

/*
  Modelo de contadores usado dentro do resumo do dashboard

  O back retorna listas neste formato para:
  - projetos_por_status
  - projetos_por_curso
  - tecnologias_mais_usadas
*/
interface DashboardContador {
  nome: string;
  total: number;
}

interface DashboardResumo {
  total_projetos: number;
  projetos_publicados: number;
  projetos_pendentes: number;
  projetos_aprovados: number;
  projetos_rejeitados: number;
  total_usuarios: number;
  total_cursos: number;
  total_tags: number;
  total_competencias: number;
  projetos_por_status: DashboardContador[];
  projetos_por_curso: DashboardContador[];
  tecnologias_mais_usadas: DashboardContador[];
}

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

@Component({
  selector: 'app-dashboard',
  imports: [Sidebar, Topbar, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;

  resumo: DashboardResumo | null = null;

  projetosRecentes: Projeto[] = [];
  usuarios: Usuario[] = [];
  turmas: Turma[] = [];
  cursos: Curso[] = [];

  carregando = true;
  mensagemErro = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    /*
      Pegam o coordenador que fez login
    */
    this.usuarioLogado = this.authService.buscarUsuario();

    if (!this.usuarioLogado) {
      this.carregando = false;
      this.mensagemErro = 'Nenhum coordenador logado foi encontrado.';
      this.changeDetector.detectChanges();
      return;
    }

    this.carregarDashboard();
  }

  carregarDashboard(): void {
    this.carregando = true;
    this.mensagemErro = '';

    /*
      buscatudo com endpoints

      /dashboard/resumo traz os números principais
      As outras rotas ajudam a montar a tabela de projetos recentes
    */
    forkJoin({
      resumo: this.apiService.get<DashboardResumo>('/dashboard/resumo'),
      projetos: this.apiService.get<Projeto[]>('/projetos').pipe(
        catchError(() => of([] as Projeto[]))
      ),
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
        this.resumo = resposta.resumo;
        this.usuarios = resposta.usuarios;
        this.turmas = resposta.turmas;
        this.cursos = resposta.cursos;

        /*
          Pega os projetos mais recentes pela data de submissão
        */
        this.projetosRecentes = resposta.projetos
          .slice()
          .sort((a, b) => {
            const dataA = new Date(a.data_submissao || '').getTime() || 0;
            const dataB = new Date(b.data_submissao || '').getTime() || 0;

            return dataB - dataA;
          })
          .slice(0, 5);

        this.carregando = false;
        this.changeDetector.detectChanges();
      },

      error: (erro) => {
        this.resumo = null;
        this.carregando = false;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end. Verifique se o FastAPI está rodando.';
        } else {
          this.mensagemErro = `Erro ao carregar dashboard. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
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
      return `Turma ${turma.nome}`;
    }

    return curso.sigla;
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

  /*
    calcula a largura das barras usando o maior valor da própria lista
    ai não precisa colocar width fixo no HTML
  */
  larguraBarra(item: DashboardContador, lista: DashboardContador[]): number {
    const maiorValor = Math.max(...lista.map((contador) => contador.total), 1);

    return Math.round((item.total / maiorValor) * 100);
  }

  taxaPublicacao(): string {
    if (!this.resumo || this.resumo.total_projetos === 0) {
      return '0%';
    }

    const taxa = (this.resumo.projetos_publicados / this.resumo.total_projetos) * 100;

    return `${Math.round(taxa)}%`;
  }
}