import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

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

interface Turma {
  id_turma: number;
  id_curso: number;
  nome: string;
  semestre: string;
  ano: number;
  turno: string;
  status: string;
}

interface NovaTurmaForm {
  id_curso: number | null;
  nome: string;
  semestre: string;
  ano: number;
  turno: string;
  status: string;
}

@Component({
  selector: 'app-administrador-turmas',
  imports: [Sidebar, Topbar, FormsModule],
  templateUrl: './turmas.html',
  styleUrl: './turmas.css'
})
export class AdministradorTurmas implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;

  turmas: Turma[] = [];
  cursos: Curso[] = [];

  carregando = true;
  salvando = false;
  processandoId: number | null = null;

  mensagemErro = '';
  mensagemSucesso = '';

  termoBusca = '';
  filtroCurso: number | 'todos' = 'todos';
  filtroStatus: 'todos' | 'ativo' | 'inativo' = 'todos';

  novaTurma: NovaTurmaForm = this.criarFormularioVazio();

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

    this.carregarDados();
  }

  criarFormularioVazio(): NovaTurmaForm {
    return {
      id_curso: null,
      nome: '',
      semestre: '',
      ano: new Date().getFullYear(),
      turno: 'Noite',
      status: 'ativo'
    };
  }

  carregarDados(): void {
    this.carregando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    /*
      Busca turmas e cursos juntos

      Cursos são necessários para:
      - mostrar o nome do curso na turma
      - preencher o select do cadastro
      - filtrar turmas por curso
    */
    forkJoin({
      turmas: this.apiService.get<Turma[]>('/turmas'),
      cursos: this.apiService.get<Curso[]>('/cursos')
    }).subscribe({
      next: (resposta) => {
        this.turmas = resposta.turmas;
        this.cursos = resposta.cursos;

        this.carregando = false;
        this.changeDetector.detectChanges();
      },

      error: (erro) => {
        this.turmas = [];
        this.cursos = [];
        this.carregando = false;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end. Verifique se o FastAPI está rodando.';
        } else {
          this.mensagemErro = `Erro ao carregar turmas. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  criarTurma(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (!this.novaTurma.id_curso) {
      this.mensagemErro = 'Selecione o curso da turma.';
      return;
    }

    if (!this.novaTurma.nome.trim()) {
      this.mensagemErro = 'Informe o nome da turma.';
      return;
    }

    if (!this.novaTurma.semestre.trim()) {
      this.mensagemErro = 'Informe o semestre da turma.';
      return;
    }

    if (!this.novaTurma.ano || this.novaTurma.ano < 2000) {
      this.mensagemErro = 'Informe um ano válido.';
      return;
    }

    const dadosTurma = {
      id_curso: Number(this.novaTurma.id_curso),
      nome: this.novaTurma.nome.trim(),
      semestre: this.novaTurma.semestre.trim(),
      ano: Number(this.novaTurma.ano),
      turno: this.novaTurma.turno.trim(),
      status: this.novaTurma.status || 'ativo'
    };

    this.salvando = true;

    /*
      Endpoint:
      POST /api/v1/turmas
    */
    this.apiService.post<Turma>('/turmas', dadosTurma).subscribe({
      next: () => {
        this.salvando = false;
        this.mensagemSucesso = 'Turma cadastrada com sucesso.';
        this.novaTurma = this.criarFormularioVazio();
        this.carregarDados();
      },

      error: (erro) => {
        this.salvando = false;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end.';
        } else if (erro.status === 400) {
          this.mensagemErro = 'Não foi possível cadastrar a turma. Verifique se ela já existe.';
        } else {
          this.mensagemErro = `Erro ao cadastrar turma. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  alterarStatus(turma: Turma): void {
    const novoStatus = turma.status === 'ativo' ? 'inativo' : 'ativo';

    const confirmar = window.confirm(
      `Deseja alterar o status da turma "${turma.nome}" para "${novoStatus}"?`
    );

    if (!confirmar) {
      return;
    }

    this.processandoId = turma.id_turma;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    /*
      Endpoint:
      PATCH /api/v1/turmas/{id_turma}/status
    */
    this.apiService
      .patch<Turma>(`/turmas/${turma.id_turma}/status`, {
        status: novoStatus
      })
      .subscribe({
        next: (turmaAtualizada) => {
          this.turmas = this.turmas.map((item) => {
            if (item.id_turma === turmaAtualizada.id_turma) {
              return turmaAtualizada;
            }

            return item;
          });

          this.processandoId = null;
          this.mensagemSucesso = 'Status da turma atualizado.';
          this.changeDetector.detectChanges();
        },

        error: (erro) => {
          this.processandoId = null;

          if (erro.status === 0) {
            this.mensagemErro = 'Não foi possível conectar ao back-end.';
          } else {
            this.mensagemErro = `Erro ao alterar status da turma. Código: ${erro.status}`;
          }

          this.changeDetector.detectChanges();
        }
      });
  }

  get turmasFiltradas(): Turma[] {
    let lista = this.turmas.slice();

    if (this.filtroCurso !== 'todos') {
      lista = lista.filter((turma) => turma.id_curso === Number(this.filtroCurso));
    }

    if (this.filtroStatus !== 'todos') {
      lista = lista.filter((turma) => turma.status === this.filtroStatus);
    }

    const busca = this.termoBusca.trim().toLowerCase();

    if (busca.length > 0) {
      lista = lista.filter((turma) => {
        return (
          turma.nome.toLowerCase().includes(busca) ||
          turma.semestre.toLowerCase().includes(busca) ||
          turma.turno.toLowerCase().includes(busca) ||
          turma.ano.toString().includes(busca) ||
          this.nomeCurso(turma.id_curso).toLowerCase().includes(busca)
        );
      });
    }

    return lista.sort((a, b) => {
      if (a.ano !== b.ano) {
        return b.ano - a.ano;
      }

      return a.nome.localeCompare(b.nome);
    });
  }

  get cursosAtivos(): Curso[] {
    return this.cursos.filter((curso) => curso.status === 'ativo');
  }

  get totalTurmas(): number {
    return this.turmas.length;
  }

  get totalAtivas(): number {
    return this.turmas.filter((turma) => turma.status === 'ativo').length;
  }

  get totalInativas(): number {
    return this.turmas.filter((turma) => turma.status === 'inativo').length;
  }

  get totalCursosComTurmas(): number {
    const idsCursos = this.turmas.map((turma) => turma.id_curso);
    const idsUnicos = new Set(idsCursos);

    return idsUnicos.size;
  }

  nomeCurso(idCurso: number): string {
    const curso = this.cursos.find((item) => item.id_curso === idCurso);

    if (!curso) {
      return `Curso #${idCurso}`;
    }

    return `${curso.sigla} - ${curso.nome}`;
  }

  siglaCurso(idCurso: number): string {
    const curso = this.cursos.find((item) => item.id_curso === idCurso);

    if (!curso) {
      return '?';
    }

    return curso.sigla;
  }

  classeStatus(status: string): string {
    return status === 'ativo' ? 'active' : 'inactive';
  }
}