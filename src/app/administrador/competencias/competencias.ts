import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';
import { ApiService } from '../../services/api.service';
import { AuthService, UsuarioLogado } from '../../services/auth.service';

interface Competencia {
  id_competencia: number;
  nome: string;
  descricao?: string | null;
  categoria: string;
  status: string;
  data_criacao?: string | null;
}

interface CompetenciaForm {
  nome: string;
  descricao: string;
  categoria: string;
  status: string;
}

@Component({
  selector: 'app-administrador-competencias',
  imports: [Sidebar, Topbar, FormsModule],
  templateUrl: './competencias.html',
  styleUrl: './competencias.css'
})
export class AdministradorCompetencias implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;

  competencias: Competencia[] = [];

  carregando = true;
  salvando = false;
  processandoId: number | null = null;

  mensagemErro = '';
  mensagemSucesso = '';

  termoBusca = '';
  filtroCategoria: string | 'todas' = 'todas';
  filtroStatus: 'todos' | 'ativo' | 'arquivado' = 'todos';

  competenciaEditando: Competencia | null = null;

  formulario: CompetenciaForm = this.criarFormularioVazio();

  categoriasBase = [
    'Técnica',
    'Comportamental',
    'Gestão',
    'Comunicação',
    'Pesquisa',
    'Design',
    'Negócios',
    'Outro'
  ];

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

    this.carregarCompetencias();
  }

  criarFormularioVazio(): CompetenciaForm {
    return {
      nome: '',
      descricao: '',
      categoria: 'Técnica',
      status: 'ativo'
    };
  }

  carregarCompetencias(): void {
    this.carregando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    this.apiService.get<Competencia[]>('/competencias').subscribe({
      next: (resposta) => {
        this.competencias = resposta;
        this.carregando = false;
        this.changeDetector.detectChanges();
      },

      error: (erro) => {
        this.competencias = [];
        this.carregando = false;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back. Verifique se o FastAPI está rodando.';
        } else {
          this.mensagemErro = `Erro ao carregar competências. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  salvarCompetencia(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (!this.formulario.nome.trim()) {
      this.mensagemErro = 'Informe o nome da competência.';
      return;
    }

    if (!this.formulario.categoria.trim()) {
      this.mensagemErro = 'Informe a categoria da competência.';
      return;
    }

    if (this.competenciaEditando) {
      this.atualizarCompetencia();
      return;
    }

    this.criarCompetencia();
  }

  criarCompetencia(): void {
    const dadosCompetencia = {
      nome: this.formulario.nome.trim(),
      descricao: this.formulario.descricao.trim() || null,
      categoria: this.formulario.categoria.trim(),
      status: this.formulario.status || 'ativo'
    };

    this.salvando = true;

    this.apiService.post<Competencia>('/competencias', dadosCompetencia).subscribe({
      next: () => {
        this.salvando = false;
        this.mensagemSucesso = 'Competência cadastrada com sucesso.';
        this.formulario = this.criarFormularioVazio();
        this.carregarCompetencias();
      },

      error: (erro) => {
        this.salvando = false;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back.';
        } else if (erro.status === 400) {
          this.mensagemErro = 'Não foi possível cadastrar a competência. Verifique se o nome já existe.';
        } else {
          this.mensagemErro = `Erro ao cadastrar competência. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  iniciarEdicao(competencia: Competencia): void {
    this.competenciaEditando = competencia;

    this.formulario = {
      nome: competencia.nome,
      descricao: competencia.descricao || '',
      categoria: competencia.categoria,
      status: competencia.status
    };

    this.mensagemErro = '';
    this.mensagemSucesso = '';

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  cancelarEdicao(): void {
    this.competenciaEditando = null;
    this.formulario = this.criarFormularioVazio();
    this.mensagemErro = '';
    this.mensagemSucesso = '';
  }

  atualizarCompetencia(): void {
    if (!this.competenciaEditando) {
      return;
    }

    const dadosCompetencia = {
      nome: this.formulario.nome.trim(),
      descricao: this.formulario.descricao.trim() || null,
      categoria: this.formulario.categoria.trim(),
      status: this.formulario.status || 'ativo'
    };

    this.salvando = true;

    this.apiService
      .put<Competencia>(
        `/competencias/${this.competenciaEditando.id_competencia}`,
        dadosCompetencia
      )
      .subscribe({
        next: () => {
          this.salvando = false;
          this.competenciaEditando = null;
          this.formulario = this.criarFormularioVazio();
          this.mensagemSucesso = 'Competência atualizada com sucesso.';
          this.carregarCompetencias();
        },

        error: (erro) => {
          this.salvando = false;

          if (erro.status === 0) {
            this.mensagemErro = 'Não foi possível conectar ao back.';
          } else if (erro.status === 400) {
            this.mensagemErro = 'Não foi possível atualizar a competência. Verifique se o nome já existe.';
          } else {
            this.mensagemErro = `Erro ao atualizar competência. Código: ${erro.status}`;
          }

          this.changeDetector.detectChanges();
        }
      });
  }

  alterarArquivamento(competencia: Competencia): void {
    if (competencia.status === 'arquivado') {
      this.reativarCompetencia(competencia);
      return;
    }

    this.arquivarCompetencia(competencia);
  }

  arquivarCompetencia(competencia: Competencia): void {
    const confirmar = window.confirm(
      `Deseja arquivar a competência "${competencia.nome}"?`
    );

    if (!confirmar) {
      return;
    }

    this.processandoId = competencia.id_competencia;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    this.apiService
      .patch<Competencia>(
        `/competencias/${competencia.id_competencia}/arquivar`,
        {}
      )
      .subscribe({
        next: (competenciaAtualizada) => {
          this.competencias = this.competencias.map((item) => {
            if (item.id_competencia === competenciaAtualizada.id_competencia) {
              return competenciaAtualizada;
            }

            return item;
          });

          this.processandoId = null;
          this.mensagemSucesso = 'Competência arquivada com sucesso.';
          this.changeDetector.detectChanges();
        },

        error: (erro) => {
          this.processandoId = null;

          if (erro.status === 0) {
            this.mensagemErro = 'Não foi possível conectar ao back.';
          } else {
            this.mensagemErro = `Erro ao arquivar competência. Código: ${erro.status}`;
          }

          this.changeDetector.detectChanges();
        }
      });
  }

  reativarCompetencia(competencia: Competencia): void {
    const confirmar = window.confirm(
      `Deseja reativar a competência "${competencia.nome}"?`
    );

    if (!confirmar) {
      return;
    }

    this.processandoId = competencia.id_competencia;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    const dadosCompetencia = {
      nome: competencia.nome,
      descricao: competencia.descricao || null,
      categoria: competencia.categoria,
      status: 'ativo'
    };

    this.apiService
      .put<Competencia>(
        `/competencias/${competencia.id_competencia}`,
        dadosCompetencia
      )
      .subscribe({
        next: (competenciaAtualizada) => {
          this.competencias = this.competencias.map((item) => {
            if (item.id_competencia === competenciaAtualizada.id_competencia) {
              return competenciaAtualizada;
            }

            return item;
          });

          this.processandoId = null;
          this.mensagemSucesso = 'Competência reativada com sucesso.';
          this.changeDetector.detectChanges();
        },

        error: (erro) => {
          this.processandoId = null;

          if (erro.status === 0) {
            this.mensagemErro = 'Não foi possível conectar ao back.';
          } else {
            this.mensagemErro = `Erro ao reativar competência. Código: ${erro.status}`;
          }

          this.changeDetector.detectChanges();
        }
      });
  }

  get categoriasDisponiveis(): string[] {
    const categoriasDasCompetencias = this.competencias.map(
      (competencia) => competencia.categoria
    );

    const categorias = [
      ...this.categoriasBase,
      ...categoriasDasCompetencias
    ];

    return Array.from(new Set(categorias)).sort((a, b) => a.localeCompare(b));
  }

  get competenciasFiltradas(): Competencia[] {
    let lista = this.competencias.slice();

    if (this.filtroCategoria !== 'todas') {
      lista = lista.filter(
        (competencia) => competencia.categoria === this.filtroCategoria
      );
    }

    if (this.filtroStatus !== 'todos') {
      lista = lista.filter(
        (competencia) => competencia.status === this.filtroStatus
      );
    }

    const busca = this.termoBusca.trim().toLowerCase();

    if (busca.length > 0) {
      lista = lista.filter((competencia) => {
        return (
          competencia.nome.toLowerCase().includes(busca) ||
          competencia.categoria.toLowerCase().includes(busca) ||
          (competencia.descricao || '').toLowerCase().includes(busca) ||
          competencia.status.toLowerCase().includes(busca)
        );
      });
    }

    return lista.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  get totalCompetencias(): number {
    return this.competencias.length;
  }

  get totalAtivas(): number {
    return this.competencias.filter(
      (competencia) => competencia.status === 'ativo'
    ).length;
  }

  get totalArquivadas(): number {
    return this.competencias.filter(
      (competencia) => competencia.status === 'arquivado'
    ).length;
  }

  get totalCategorias(): number {
    const categorias = this.competencias.map(
      (competencia) => competencia.categoria
    );

    return new Set(categorias).size;
  }

  classeStatus(status: string): string {
    return status === 'ativo' ? 'active' : 'archived';
  }

  formatarData(data?: string | null): string {
    if (!data) {
      return '-';
    }

    return new Date(data).toLocaleDateString('pt-BR');
  }
}