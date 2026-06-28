import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';
import { ApiService } from '../../services/api.service';
import { AuthService, UsuarioLogado } from '../../services/auth.service';

interface Usuario {
  id_usuario: number;
  id_perfil: number;
  id_turma?: number | null;
  nome: string;
  email: string;
  matricula?: string | null;
  departamento?: string | null;
  tipo_aluno?: string | null;
  status: string;
  telefone?: string | null;
  foto_perfil?: string | null;
  data_cadastro?: string | null;
  data_ultimo_acesso?: string | null;
}

interface Perfil {
  id_perfil: number;
  nome: string;
  descricao?: string | null;
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

interface NovoUsuarioForm {
  id_perfil: number;
  id_turma: number | null;
  nome: string;
  email: string;
  senha_hash: string;
  matricula: string;
  departamento: string;
  tipo_aluno: string;
  status: string;
  telefone: string;
  foto_perfil: string | null;
}

@Component({
  selector: 'app-administrador-usuarios',
  imports: [Sidebar, Topbar, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class AdministradorUsuarios implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;

  usuarios: Usuario[] = [];
  perfis: Perfil[] = [];
  turmas: Turma[] = [];

  carregando = true;
  salvando = false;
  processandoId: number | null = null;

  mensagemErro = '';
  mensagemSucesso = '';

  termoBusca = '';
  filtroPerfil: number | 'todos' = 'todos';
  filtroStatus: 'todos' | 'ativo' | 'inativo' = 'todos';

  novoUsuario: NovoUsuarioForm = this.criarFormularioVazio();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    /*
      O admin logado fica salvo no navegador depois do login.
      Usa isso para mostrar o nome dele na topbar.
    */
    this.usuarioLogado = this.authService.buscarUsuario();

    if (!this.usuarioLogado) {
      this.carregando = false;
      this.mensagemErro = 'Nenhum administrador logado foi encontrado.';
      this.changeDetector.detectChanges();
      return;
    }

    this.carregarDados();
  }

  criarFormularioVazio(): NovoUsuarioForm {
    return {
      id_perfil: 1,
      id_turma: null,
      nome: '',
      email: '',
      senha_hash: '123456',
      matricula: '',
      departamento: '',
      tipo_aluno: 'regular',
      status: 'ativo',
      telefone: '',
      foto_perfil: null
    };
  }

  carregarDados(): void {
    this.carregando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    /*
      Carrega usuários, perfis e turmas.
      perfis servem para mostrar "Aluno", "Professor", "Coordenador" etc.
      turmas servem para cadastrar aluno, já que aluno pode estar vinculado a turma
    */
    Promise.all([
      this.apiService.get<Usuario[]>('/usuarios').toPromise(),
      this.apiService.get<Perfil[]>('/perfis').toPromise(),
      this.apiService.get<Turma[]>('/turmas').toPromise()
    ])
      .then(([usuarios, perfis, turmas]) => {
        this.usuarios = usuarios || [];
        this.perfis = perfis || [];
        this.turmas = turmas || [];

        this.carregando = false;
        this.changeDetector.detectChanges();
      })
      .catch((erro) => {
        this.usuarios = [];
        this.perfis = [];
        this.turmas = [];
        this.carregando = false;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end. Verifique se o FastAPI está rodando.';
        } else {
          this.mensagemErro = `Erro ao carregar usuários. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      });
  }

  criarUsuario(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (!this.novoUsuario.nome.trim()) {
      this.mensagemErro = 'Informe o nome do usuário.';
      return;
    }

    if (!this.novoUsuario.email.trim()) {
      this.mensagemErro = 'Informe o e-mail do usuário.';
      return;
    }

    if (!this.novoUsuario.senha_hash.trim()) {
      this.mensagemErro = 'Informe uma senha inicial.';
      return;
    }

    const perfilSelecionado = Number(this.novoUsuario.id_perfil);
    const ehAluno = perfilSelecionado === 1;

    /*
      Para aluno, envia matrícula, tipo_aluno e turma.
      Para professor, coordenador e administrador, envia departamento.
      Campos sem uso vão como null para não salvar textos inúteis como "string".
    */
    const dadosUsuario = {
      id_perfil: perfilSelecionado,
      id_turma: ehAluno ? this.novoUsuario.id_turma : null,
      nome: this.novoUsuario.nome.trim(),
      email: this.novoUsuario.email.trim(),
      senha_hash: this.novoUsuario.senha_hash.trim(),
      matricula: ehAluno ? this.novoUsuario.matricula.trim() || null : null,
      departamento: !ehAluno ? this.novoUsuario.departamento.trim() || null : null,
      tipo_aluno: ehAluno ? this.novoUsuario.tipo_aluno || 'regular' : null,
      status: this.novoUsuario.status || 'ativo',
      telefone: this.novoUsuario.telefone.trim() || null,
      foto_perfil: null
    };

    this.salvando = true;

    this.apiService.post<Usuario>('/usuarios', dadosUsuario).subscribe({
      next: () => {
        this.salvando = false;
        this.mensagemSucesso = 'Usuário cadastrado com sucesso.';
        this.novoUsuario = this.criarFormularioVazio();
        this.carregarDados();
      },

      error: (erro) => {
        this.salvando = false;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end.';
        } else {
          this.mensagemErro = `Erro ao cadastrar usuário. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  alterarStatus(usuario: Usuario): void {
    const novoStatus = usuario.status === 'ativo' ? 'inativo' : 'ativo';

    const confirmar = window.confirm(
      `Deseja alterar o status de "${usuario.nome}" para "${novoStatus}"?`
    );

    if (!confirmar) {
      return;
    }

    this.processandoId = usuario.id_usuario;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    /*
      Endpoint:
      PATCH /api/v1/usuarios/{id_usuario}/status
    */
    this.apiService
      .patch<Usuario>(`/usuarios/${usuario.id_usuario}/status`, {
        status: novoStatus
      })
      .subscribe({
        next: (usuarioAtualizado) => {
          this.usuarios = this.usuarios.map((item) => {
            if (item.id_usuario === usuarioAtualizado.id_usuario) {
              return usuarioAtualizado;
            }

            return item;
          });

          this.processandoId = null;
          this.mensagemSucesso = 'Status do usuário atualizado.';
          this.changeDetector.detectChanges();
        },

        error: (erro) => {
          this.processandoId = null;

          if (erro.status === 0) {
            this.mensagemErro = 'Não foi possível conectar ao back-end.';
          } else {
            this.mensagemErro = `Erro ao alterar status. Código: ${erro.status}`;
          }

          this.changeDetector.detectChanges();
        }
      });
  }

  get usuariosFiltrados(): Usuario[] {
    let lista = this.usuarios.slice();

    if (this.filtroPerfil !== 'todos') {
      lista = lista.filter((usuario) => usuario.id_perfil === Number(this.filtroPerfil));
    }

    if (this.filtroStatus !== 'todos') {
      lista = lista.filter((usuario) => usuario.status === this.filtroStatus);
    }

    const busca = this.termoBusca.trim().toLowerCase();

    if (busca.length > 0) {
      lista = lista.filter((usuario) => {
        return (
          usuario.nome.toLowerCase().includes(busca) ||
          usuario.email.toLowerCase().includes(busca) ||
          this.nomePerfil(usuario.id_perfil).toLowerCase().includes(busca)
        );
      });
    }

    return lista.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  get totalUsuarios(): number {
    return this.usuarios.length;
  }

  get totalAtivos(): number {
    return this.usuarios.filter((usuario) => usuario.status === 'ativo').length;
  }

  get totalAlunos(): number {
    return this.usuarios.filter((usuario) => usuario.id_perfil === 1).length;
  }

  get totalProfessores(): number {
    return this.usuarios.filter((usuario) => usuario.id_perfil === 2).length;
  }

  nomePerfil(idPerfil: number): string {
    const perfil = this.perfis.find((item) => item.id_perfil === idPerfil);

    if (!perfil) {
      return `Perfil #${idPerfil}`;
    }

    return perfil.nome;
  }

  nomeTurma(idTurma?: number | null): string {
    if (!idTurma) {
      return '-';
    }

    const turma = this.turmas.find((item) => item.id_turma === idTurma);

    if (!turma) {
      return `Turma #${idTurma}`;
    }

    return `${turma.nome} - ${turma.semestre}/${turma.ano}`;
  }

  classeStatus(status: string): string {
    return status === 'ativo' ? 'active' : 'inactive';
  }
}