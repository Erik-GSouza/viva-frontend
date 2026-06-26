import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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

interface TagProjeto {
  id_projeto_tag: number;
  id_projeto: number;
  id_tag: number;
  nome: string;
  categoria: string;
  cor?: string | null;
  status: string;
}

interface CompetenciaProjeto {
  id_projeto_competencia: number;
  id_projeto: number;
  id_competencia: number;
  nome: string;
  descricao?: string | null;
  categoria: string;
  nivel: string;
  status: string;
}

interface IntegranteProjeto {
  id_integrante_projeto: number;
  id_usuario: number;
  id_projeto: number;
  funcao: string;
  data_vinculo: string | null;
}

interface VersaoProjeto {
  id_versao: number;
  id_projeto: number;
  numero_versao: number;
  descricao_alteracao: string;
  data_envio: string | null;
  status_versao: string;
}

interface ArquivoProjeto {
  id_arquivo: number;
  id_projeto: number;
  id_versao: number | null;
  nome_arquivo: string;
  tipo_arquivo: string;
  url_arquivo: string | null;
  tamanho_arquivo: number | null;
  data_upload: string | null;
  principal: number | boolean;
  nivel_acesso: string;
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

@Component({
  selector: 'app-aluno-projeto-detalhes',
  imports: [Sidebar, Topbar, RouterLink],
  templateUrl: './projeto-detalhes.html',
  styleUrl: './projeto-detalhes.css'
})
export class AlunoProjetoDetalhes implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;

  projeto: Projeto | null = null;

  usuarios: Usuario[] = [];
  tags: TagProjeto[] = [];
  competencias: CompetenciaProjeto[] = [];
  integrantes: IntegranteProjeto[] = [];
  versoes: VersaoProjeto[] = [];
  arquivos: ArquivoProjeto[] = [];
  avaliacoes: Avaliacao[] = [];

  carregando = true;
  mensagemErro = '';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuarioLogado = this.authService.buscarUsuario();

    if (!this.usuarioLogado) {
      this.carregando = false;
      this.mensagemErro = 'Nenhum usuário logado foi encontrado.';
      this.changeDetector.detectChanges();
      return;
    }

    const idProjeto = Number(this.route.snapshot.paramMap.get('id'));

    if (!idProjeto) {
      this.carregando = false;
      this.mensagemErro = 'Projeto inválido.';
      this.changeDetector.detectChanges();
      return;
    }

    this.carregarDetalhesCompletos(idProjeto);
  }

  carregarDetalhesCompletos(idProjeto: number): void {
    this.carregando = true;
    this.mensagemErro = '';

    /*
      Busca o projeto e todos os dados relacionados do back

      O catchError com "of([])" serve para uma lista vazia não quebrar a tela
      caso algum relacionamento ainda não tenha dados
    */
    forkJoin({
      projeto: this.apiService.get<Projeto>(`/projetos/${idProjeto}`),

      usuarios: this.apiService.get<Usuario[]>('/usuarios').pipe(
        catchError(() => of([]))
      ),

      tags: this.apiService.get<TagProjeto[]>(`/projetos/${idProjeto}/tags`).pipe(
        catchError(() => of([]))
      ),

      competencias: this.apiService.get<CompetenciaProjeto[]>(`/projetos/${idProjeto}/competencias`).pipe(
        catchError(() => of([]))
      ),

      integrantes: this.apiService.get<IntegranteProjeto[]>(`/projetos/${idProjeto}/integrantes`).pipe(
        catchError(() => of([]))
      ),

      versoes: this.apiService.get<VersaoProjeto[]>(`/projetos/${idProjeto}/versoes`).pipe(
        catchError(() => of([]))
      ),

      arquivos: this.apiService.get<ArquivoProjeto[]>(`/projetos/${idProjeto}/arquivos`).pipe(
        catchError(() => of([]))
      ),

      avaliacoes: this.apiService.get<Avaliacao[]>(`/projetos/${idProjeto}/avaliacoes`).pipe(
        catchError(() => of([]))
      )
    }).subscribe({
      next: (resposta) => {
        /*
          Segurança:
          o aluno só ve detalhes de projetos que ele mesmo submeteu
        */
        if (resposta.projeto.id_usuario_submissor !== this.usuarioLogado?.id_usuario) {
          this.projeto = null;
          this.carregando = false;
          this.mensagemErro = 'Você não tem acesso a este projeto.';
          this.changeDetector.detectChanges();
          return;
        }

        this.projeto = resposta.projeto;
        this.usuarios = resposta.usuarios;
        this.tags = resposta.tags;
        this.competencias = resposta.competencias;
        this.integrantes = resposta.integrantes;
        this.versoes = resposta.versoes;
        this.arquivos = resposta.arquivos;
        this.avaliacoes = resposta.avaliacoes;

        this.carregando = false;
        this.changeDetector.detectChanges();
      },

      error: (erro) => {
        this.projeto = null;
        this.carregando = false;

        if (erro.status === 404) {
          this.mensagemErro = 'Projeto não encontrado.';
        } else {
          this.mensagemErro = `Erro ao carregar projeto. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  nomeUsuarioPorId(idUsuario: number): string {
    const usuario = this.usuarios.find((item) => item.id_usuario === idUsuario);

    if (!usuario) {
      return `Usuário #${idUsuario}`;
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

  publicadoTexto(publicado: number): string {
    return publicado === 1 ? 'Sim' : 'Não';
  }

  formatarPrincipal(valor: number | boolean): string {
    return valor === true || valor === 1 ? 'Sim' : 'Não';
  }

  formatarNota(nota: number | null): string {
    if (nota === null || nota === undefined) {
      return '-';
    }

    return String(nota);
  }
}