import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiService } from '../../services/api.service';

/*
  Modelo público principal do projeto

  Essa pag é aberta pelos visitantes
*/
interface ProjetoPublico {
  id_projeto: number;
  titulo: string;
  descricao: string;
  problema?: string | null;
  solucao?: string | null;
  status: string;
  publicado: number;
  slug_publico?: string | null;
  data_submissao?: string | null;
  data_aprovacao?: string | null;
  turma?: string | null;
  curso?: string | null;
  sigla_curso?: string | null;
}

/*
  Tags/tecnologias públicas do projeto
  Ex: Angular, Python, SQLite3
*/
interface ProjetoPublicoTag {
  id_tag: number;
  nome: string;
  categoria: string;
  cor?: string | null;
}

/*
  Competências públicas do projeto
  Ex: Desenvolvimento Web, Banco de Dados, UX.
*/
interface ProjetoPublicoCompetencia {
  id_competencia: number;
  nome: string;
  descricao?: string | null;
  categoria: string;
  nivel: string;
}

/*
  Integrantes públicos do projeto

  Não usa email aqui pq a vitrine pública não vai expor esse dado
  O slug_portfolio já prepara o caminho para depois criar o portfólio público
*/
interface ProjetoPublicoIntegrante {
  id_usuario: number;
  nome: string;
  funcao: string;
  slug_portfolio?: string | null;
}

@Component({
  selector: 'app-projeto-publico-detalhes',
  imports: [RouterLink],
  templateUrl: './projeto-publico-detalhes.html',
  styleUrl: './projeto-publico-detalhes.css'
})
export class ProjetoPublicoDetalhes implements OnInit {
  projeto: ProjetoPublico | null = null;

  tags: ProjetoPublicoTag[] = [];
  competencias: ProjetoPublicoCompetencia[] = [];
  integrantes: ProjetoPublicoIntegrante[] = [];

  carregando = true;
  mensagemErro = '';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const slugPublico = this.route.snapshot.paramMap.get('slug_publico');

    if (!slugPublico) {
      this.carregando = false;
      this.mensagemErro = 'Projeto público inválido.';
      this.changeDetector.detectChanges();
      return;
    }

    this.carregarProjeto(slugPublico);
  }

  carregarProjeto(slugPublico: string): void {
    this.carregando = true;
    this.mensagemErro = '';

    /*
      Busca tudo com endpoints publi.
      O projeto principal é que é obrigatório.
      Tags, competências e integrantes são complementares; se algum deles falhar,
      a página ainda abre, só deixa aquela seção vazia.
    */
    forkJoin({
      projeto: this.apiService.get<ProjetoPublico>(`/publico/projetos/${slugPublico}`),

      tags: this.apiService.get<ProjetoPublicoTag[]>(`/publico/projetos/${slugPublico}/tags`).pipe(
        catchError(() => of([] as ProjetoPublicoTag[]))
      ),

      competencias: this.apiService.get<ProjetoPublicoCompetencia[]>(`/publico/projetos/${slugPublico}/competencias`).pipe(
        catchError(() => of([] as ProjetoPublicoCompetencia[]))
      ),

      integrantes: this.apiService.get<ProjetoPublicoIntegrante[]>(`/publico/projetos/${slugPublico}/integrantes`).pipe(
        catchError(() => of([] as ProjetoPublicoIntegrante[]))
      )
    }).subscribe({
      next: (resposta) => {
        this.projeto = resposta.projeto;
        this.tags = resposta.tags;
        this.competencias = resposta.competencias;
        this.integrantes = resposta.integrantes;

        this.carregando = false;
        this.changeDetector.detectChanges();
      },

      error: (erro) => {
        this.projeto = null;
        this.tags = [];
        this.competencias = [];
        this.integrantes = [];
        this.carregando = false;

        if (erro.status === 404) {
          this.mensagemErro = 'Projeto público não encontrado.';
        } else if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end.';
        } else {
          this.mensagemErro = `Erro ao carregar projeto público. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  formatarData(data?: string | null): string {
    if (!data) {
      return '-';
    }

    return new Date(data).toLocaleDateString('pt-BR');
  }

  textoCurso(): string {
    if (!this.projeto) {
      return '-';
    }

    if (this.projeto.sigla_curso) {
      return this.projeto.sigla_curso;
    }

    if (this.projeto.curso) {
      return this.projeto.curso;
    }

    return 'Curso não informado';
  }

  formatarNivel(nivel: string): string {
    if (nivel === 'basico') return 'Básico';
    if (nivel === 'intermediario') return 'Intermediário';
    if (nivel === 'avancado') return 'Avançado';

    return nivel;
  }
}