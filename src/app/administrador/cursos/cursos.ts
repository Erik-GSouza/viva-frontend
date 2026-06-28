import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';
import { ApiService } from '../../services/api.service';
import { AuthService, UsuarioLogado } from '../../services/auth.service';

interface Curso {
  id_curso: number;
  nome: string;
  sigla: string;
  descricao?: string | null;
  status: string;
}

interface NovoCursoForm {
  nome: string;
  sigla: string;
  descricao: string;
  status: string;
}

@Component({
  selector: 'app-administrador-cursos',
  imports: [Sidebar, Topbar, FormsModule],
  templateUrl: './cursos.html',
  styleUrl: './cursos.css'
})
export class AdministradorCursos implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;

  cursos: Curso[] = [];

  carregando = true;
  salvando = false;
  processandoId: number | null = null;

  mensagemErro = '';
  mensagemSucesso = '';

  termoBusca = '';
  filtroStatus: 'todos' | 'ativo' | 'inativo' = 'todos';

  novoCurso: NovoCursoForm = this.criarFormularioVazio();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuarioLogado = this.authService.buscarUsuario();

    if (!this.usuarioLogado) {
      this.carregando = false;
      this.mensagemErro = 'Nenhum administrador logado foi encontrado.';
      this.changeDetector.detectChanges();
      return;
    }

    this.carregarCursos();
  }

  criarFormularioVazio(): NovoCursoForm {
    return {
      nome: '',
      sigla: '',
      descricao: '',
      status: 'ativo'
    };
  }

  carregarCursos(): void {
    this.carregando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    /*
      Endpoint:
      GET /api/v1/cursos
    */
    this.apiService.get<Curso[]>('/cursos').subscribe({
      next: (resposta) => {
        this.cursos = resposta;
        this.carregando = false;
        this.changeDetector.detectChanges();
      },

      error: (erro) => {
        this.cursos = [];
        this.carregando = false;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end. Verifique se o FastAPI está rodando.';
        } else {
          this.mensagemErro = `Erro ao carregar cursos. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  criarCurso(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (!this.novoCurso.nome.trim()) {
      this.mensagemErro = 'Informe o nome do curso.';
      return;
    }

    if (!this.novoCurso.sigla.trim()) {
      this.mensagemErro = 'Informe a sigla do curso.';
      return;
    }

    const dadosCurso = {
      nome: this.novoCurso.nome.trim(),
      sigla: this.novoCurso.sigla.trim().toUpperCase(),
      descricao: this.novoCurso.descricao.trim() || null,
      status: this.novoCurso.status || 'ativo'
    };

    this.salvando = true;

    /*
      Endpoint:
      POST /api/v1/cursos
    */
    this.apiService.post<Curso>('/cursos', dadosCurso).subscribe({
      next: () => {
        this.salvando = false;
        this.mensagemSucesso = 'Curso cadastrado com sucesso.';
        this.novoCurso = this.criarFormularioVazio();
        this.carregarCursos();
      },

      error: (erro) => {
        this.salvando = false;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end.';
        } else if (erro.status === 400) {
          this.mensagemErro = 'Não foi possível cadastrar o curso. Verifique se a sigla já existe.';
        } else {
          this.mensagemErro = `Erro ao cadastrar curso. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  alterarStatus(curso: Curso): void {
    const novoStatus = curso.status === 'ativo' ? 'inativo' : 'ativo';

    const confirmar = window.confirm(
      `Deseja alterar o status do curso "${curso.sigla}" para "${novoStatus}"?`
    );

    if (!confirmar) {
      return;
    }

    this.processandoId = curso.id_curso;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    /*
      Endpoint:
      PATCH /api/v1/cursos/{id_curso}/status
    */
    this.apiService
      .patch<Curso>(`/cursos/${curso.id_curso}/status`, {
        status: novoStatus
      })
      .subscribe({
        next: (cursoAtualizado) => {
          this.cursos = this.cursos.map((item) => {
            if (item.id_curso === cursoAtualizado.id_curso) {
              return cursoAtualizado;
            }

            return item;
          });

          this.processandoId = null;
          this.mensagemSucesso = 'Status do curso atualizado.';
          this.changeDetector.detectChanges();
        },

        error: (erro) => {
          this.processandoId = null;

          if (erro.status === 0) {
            this.mensagemErro = 'Não foi possível conectar ao back-end.';
          } else {
            this.mensagemErro = `Erro ao alterar status do curso. Código: ${erro.status}`;
          }

          this.changeDetector.detectChanges();
        }
      });
  }

  get cursosFiltrados(): Curso[] {
    let lista = this.cursos.slice();

    if (this.filtroStatus !== 'todos') {
      lista = lista.filter((curso) => curso.status === this.filtroStatus);
    }

    const busca = this.termoBusca.trim().toLowerCase();

    if (busca.length > 0) {
      lista = lista.filter((curso) => {
        return (
          curso.nome.toLowerCase().includes(busca) ||
          curso.sigla.toLowerCase().includes(busca) ||
          (curso.descricao || '').toLowerCase().includes(busca)
        );
      });
    }

    return lista.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  get totalCursos(): number {
    return this.cursos.length;
  }

  get totalAtivos(): number {
    return this.cursos.filter((curso) => curso.status === 'ativo').length;
  }

  get totalInativos(): number {
    return this.cursos.filter((curso) => curso.status === 'inativo').length;
  }

  classeStatus(status: string): string {
    return status === 'ativo' ? 'active' : 'inactive';
  }
}