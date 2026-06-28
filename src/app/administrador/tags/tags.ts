import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';
import { ApiService } from '../../services/api.service';
import { AuthService, UsuarioLogado } from '../../services/auth.service';

interface TagTecnologia {
  id_tag: number;
  nome: string;
  categoria: string;
  cor?: string | null;
  status: string;
  data_criacao?: string | null;
}

interface TagForm {
  nome: string;
  categoria: string;
  cor: string;
  status: string;
}

@Component({
  selector: 'app-administrador-tags',
  imports: [Sidebar, Topbar, FormsModule],
  templateUrl: './tags.html',
  styleUrl: './tags.css'
})
export class AdministradorTags implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;

  tags: TagTecnologia[] = [];

  carregando = true;
  salvando = false;
  processandoId: number | null = null;

  mensagemErro = '';
  mensagemSucesso = '';

  termoBusca = '';
  filtroCategoria: string | 'todas' = 'todas';
  filtroStatus: 'todos' | 'ativo' | 'arquivado' = 'todos';

  tagEditando: TagTecnologia | null = null;

  formulario: TagForm = this.criarFormularioVazio();

  categoriasBase = [
    'Linguagem',
    'Framework',
    'Biblioteca',
    'Banco de Dados',
    'Ferramenta',
    'Metodologia',
    'Design',
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

    this.carregarTags();
  }

  criarFormularioVazio(): TagForm {
    return {
      nome: '',
      categoria: 'Framework',
      cor: '#0f4c81',
      status: 'ativo'
    };
  }

  carregarTags(): void {
    this.carregando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    /*
      Endpoint:
      GET /api/v1/tags
    */
    this.apiService.get<TagTecnologia[]>('/tags').subscribe({
      next: (resposta) => {
        this.tags = resposta;
        this.carregando = false;
        this.changeDetector.detectChanges();
      },

      error: (erro) => {
        this.tags = [];
        this.carregando = false;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end. Verifique se o FastAPI está rodando.';
        } else {
          this.mensagemErro = `Erro ao carregar tags. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  salvarTag(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (!this.formulario.nome.trim()) {
      this.mensagemErro = 'Informe o nome da tag ou tecnologia.';
      return;
    }

    if (!this.formulario.categoria.trim()) {
      this.mensagemErro = 'Informe a categoria.';
      return;
    }

    if (this.tagEditando) {
      this.atualizarTag();
      return;
    }

    this.criarTag();
  }

  criarTag(): void {
    const dadosTag = {
      nome: this.formulario.nome.trim(),
      categoria: this.formulario.categoria.trim(),
      cor: this.formulario.cor || null,
      status: this.formulario.status || 'ativo'
    };

    this.salvando = true;

    /*
      Endpoint:
      POST /api/v1/tags
    */
    this.apiService.post<TagTecnologia>('/tags', dadosTag).subscribe({
      next: () => {
        this.salvando = false;
        this.mensagemSucesso = 'Tag cadastrada com sucesso.';
        this.formulario = this.criarFormularioVazio();
        this.carregarTags();
      },

      error: (erro) => {
        this.salvando = false;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end.';
        } else if (erro.status === 400) {
          this.mensagemErro = 'Não foi possível cadastrar a tag. Verifique se o nome já existe.';
        } else {
          this.mensagemErro = `Erro ao cadastrar tag. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  iniciarEdicao(tag: TagTecnologia): void {
    this.tagEditando = tag;

    this.formulario = {
      nome: tag.nome,
      categoria: tag.categoria,
      cor: tag.cor || '#0f4c81',
      status: tag.status
    };

    this.mensagemErro = '';
    this.mensagemSucesso = '';

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  cancelarEdicao(): void {
    this.tagEditando = null;
    this.formulario = this.criarFormularioVazio();
    this.mensagemErro = '';
    this.mensagemSucesso = '';
  }

  atualizarTag(): void {
    if (!this.tagEditando) {
      return;
    }

    const dadosTag = {
      nome: this.formulario.nome.trim(),
      categoria: this.formulario.categoria.trim(),
      cor: this.formulario.cor || null,
      status: this.formulario.status || 'ativo'
    };

    this.salvando = true;

    /*
      Endpoint:
      PUT /api/v1/tags/{id_tag}
    */
    this.apiService
      .put<TagTecnologia>(`/tags/${this.tagEditando.id_tag}`, dadosTag)
      .subscribe({
        next: () => {
          this.salvando = false;
          this.tagEditando = null;
          this.formulario = this.criarFormularioVazio();
          this.mensagemSucesso = 'Tag atualizada com sucesso.';
          this.carregarTags();
        },

        error: (erro) => {
          this.salvando = false;

          if (erro.status === 0) {
            this.mensagemErro = 'Não foi possível conectar ao back-end.';
          } else if (erro.status === 400) {
            this.mensagemErro = 'Não foi possível atualizar a tag. Verifique se o nome já existe.';
          } else {
            this.mensagemErro = `Erro ao atualizar tag. Código: ${erro.status}`;
          }

          this.changeDetector.detectChanges();
        }
      });
  }

  alterarArquivamento(tag: TagTecnologia): void {
    if (tag.status === 'arquivado') {
      this.reativarTag(tag);
      return;
    }

    this.arquivarTag(tag);
  }

  arquivarTag(tag: TagTecnologia): void {
    const confirmar = window.confirm(
      `Deseja arquivar a tag "${tag.nome}"?`
    );

    if (!confirmar) {
      return;
    }

    this.processandoId = tag.id_tag;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    /*
      Endpoint:
      PATCH /api/v1/tags/{id_tag}/arquivar
    */
    this.apiService
      .patch<TagTecnologia>(`/tags/${tag.id_tag}/arquivar`, {})
      .subscribe({
        next: (tagAtualizada) => {
          this.tags = this.tags.map((item) => {
            if (item.id_tag === tagAtualizada.id_tag) {
              return tagAtualizada;
            }

            return item;
          });

          this.processandoId = null;
          this.mensagemSucesso = 'Tag arquivada com sucesso.';
          this.changeDetector.detectChanges();
        },

        error: (erro) => {
          this.processandoId = null;

          if (erro.status === 0) {
            this.mensagemErro = 'Não foi possível conectar ao back-end.';
          } else {
            this.mensagemErro = `Erro ao arquivar tag. Código: ${erro.status}`;
          }

          this.changeDetector.detectChanges();
        }
      });
  }

  reativarTag(tag: TagTecnologia): void {
    const confirmar = window.confirm(
      `Deseja reativar a tag "${tag.nome}"?`
    );

    if (!confirmar) {
      return;
    }

    this.processandoId = tag.id_tag;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    /*
      back tá sem um endpoint separado de "reativar".
      Então usamos o endpoint de atualização e altera o status pra ativo.
    */
    const dadosTag = {
      nome: tag.nome,
      categoria: tag.categoria,
      cor: tag.cor || null,
      status: 'ativo'
    };

    this.apiService
      .put<TagTecnologia>(`/tags/${tag.id_tag}`, dadosTag)
      .subscribe({
        next: (tagAtualizada) => {
          this.tags = this.tags.map((item) => {
            if (item.id_tag === tagAtualizada.id_tag) {
              return tagAtualizada;
            }

            return item;
          });

          this.processandoId = null;
          this.mensagemSucesso = 'Tag reativada com sucesso.';
          this.changeDetector.detectChanges();
        },

        error: (erro) => {
          this.processandoId = null;

          if (erro.status === 0) {
            this.mensagemErro = 'Não foi possível conectar ao back-end.';
          } else {
            this.mensagemErro = `Erro ao reativar tag. Código: ${erro.status}`;
          }

          this.changeDetector.detectChanges();
        }
      });
  }

  get categoriasDisponiveis(): string[] {
    const categoriasDasTags = this.tags.map((tag) => tag.categoria);
    const categorias = [...this.categoriasBase, ...categoriasDasTags];

    return Array.from(new Set(categorias)).sort((a, b) => a.localeCompare(b));
  }

  get tagsFiltradas(): TagTecnologia[] {
    let lista = this.tags.slice();

    if (this.filtroCategoria !== 'todas') {
      lista = lista.filter((tag) => tag.categoria === this.filtroCategoria);
    }

    if (this.filtroStatus !== 'todos') {
      lista = lista.filter((tag) => tag.status === this.filtroStatus);
    }

    const busca = this.termoBusca.trim().toLowerCase();

    if (busca.length > 0) {
      lista = lista.filter((tag) => {
        return (
          tag.nome.toLowerCase().includes(busca) ||
          tag.categoria.toLowerCase().includes(busca) ||
          tag.status.toLowerCase().includes(busca)
        );
      });
    }

    return lista.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  get totalTags(): number {
    return this.tags.length;
  }

  get totalAtivas(): number {
    return this.tags.filter((tag) => tag.status === 'ativo').length;
  }

  get totalArquivadas(): number {
    return this.tags.filter((tag) => tag.status === 'arquivado').length;
  }

  get totalCategorias(): number {
    const categorias = this.tags.map((tag) => tag.categoria);
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