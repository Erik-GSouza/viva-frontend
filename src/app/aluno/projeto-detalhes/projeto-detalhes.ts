import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';
import { ApiService } from '../../services/api.service';
import { AuthService, UsuarioLogado } from '../../services/auth.service';

/*
  Representa o projeto retornado pelo back-end.

  Aqui usa os mesmos campos que vêm do FastAPI
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

@Component({
  selector: 'app-aluno-projeto-detalhes',

  /*
    Importa Sidebar e Topbar para manter o layout interno
    Importa RouterLink para poder usar links no HTML
  */
  imports: [Sidebar, Topbar, RouterLink],

  templateUrl: './projeto-detalhes.html',
  styleUrl: './projeto-detalhes.css'
})
export class AlunoProjetoDetalhes implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;

  projeto: Projeto | null = null;

  carregando = true;
  mensagemErro = '';

  constructor(
    /*
      ActivatedRoute serve para pegar o id que vem na URL

      Ex:
      /aluno/projetos/1

      O id será 1
    */
    private route: ActivatedRoute,

    private apiService: ApiService,
    private authService: AuthService,

    /*
      Mantivemos o ChangeDetectorRef pq ele resolveu
      o problema da tela não atualizar depois da resposta do back
    */
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    /*
      Buscamos o usuario logado salvo no localStorage
    */
    this.usuarioLogado = this.authService.buscarUsuario();

    if (!this.usuarioLogado) {
      this.carregando = false;
      this.mensagemErro = 'Nenhum usuário logado foi encontrado.';
      this.changeDetector.detectChanges();
      return;
    }

    /*
      Pegamos o id do projeto pela URL
    */
    const idProjeto = Number(this.route.snapshot.paramMap.get('id'));

    if (!idProjeto) {
      this.carregando = false;
      this.mensagemErro = 'Projeto inválido.';
      this.changeDetector.detectChanges();
      return;
    }

    this.carregarProjeto(idProjeto);
  }

  /*
    Busca o projeto especifico no back

    Endpoint:
    GET /api/v1/projetos/{id_projeto}
  */
  carregarProjeto(idProjeto: number): void {
    this.carregando = true;
    this.mensagemErro = '';

    this.apiService.get<Projeto>(`/projetos/${idProjeto}`).subscribe({
      next: (resposta) => {
        /*
          Segurançazinha:
          o aluno só pode visualizar projeto que ele mesmo submeteu
        */
        if (resposta.id_usuario_submissor !== this.usuarioLogado?.id_usuario) {
          this.projeto = null;
          this.carregando = false;
          this.mensagemErro = 'Você não tem acesso a este projeto.';
          this.changeDetector.detectChanges();
          return;
        }

        this.projeto = resposta;
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

  publicadoTexto(publicado: number): string {
    return publicado === 1 ? 'Sim' : 'Não';
  }
}