import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiService } from '../../services/api.service';

interface PortfolioPublico {
  id_portfolio: number;
  id_usuario: number;
  nome_usuario: string;
  titulo: string;
  bio?: string | null;
  slug_publico: string;
  status: string;
}

interface PortfolioProjetoPublico {
  id_projeto: number;
  titulo: string;
  descricao: string;
  slug_publico?: string | null;
  data_aprovacao?: string | null;
  turma?: string | null;
  curso?: string | null;
  sigla_curso?: string | null;
  funcao: string;
}

@Component({
  selector: 'app-portfolio-publico',
  imports: [RouterLink],
  templateUrl: './portfolio-publico.html',
  styleUrl: './portfolio-publico.css'
})
export class PortfolioPublicoComponent implements OnInit {
  portfolio: PortfolioPublico | null = null;
  projetos: PortfolioProjetoPublico[] = [];

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
      this.mensagemErro = 'Portfólio público inválido.';
      this.changeDetector.detectChanges();
      return;
    }

    this.carregarPortfolio(slugPublico);
  }

  carregarPortfolio(slugPublico: string): void {
    this.carregando = true;
    this.mensagemErro = '';

    /*
      Buscam o portfólio público e os projetos publicados em que o aluno participou
    */
    forkJoin({
      portfolio: this.apiService.get<PortfolioPublico>(`/publico/portfolios/${slugPublico}`),

      projetos: this.apiService
        .get<PortfolioProjetoPublico[]>(`/publico/portfolios/${slugPublico}/projetos`)
        .pipe(catchError(() => of([] as PortfolioProjetoPublico[])))
    }).subscribe({
      next: (resposta) => {
        this.portfolio = resposta.portfolio;
        this.projetos = resposta.projetos;

        this.carregando = false;
        this.changeDetector.detectChanges();
      },

      error: (erro) => {
        this.portfolio = null;
        this.projetos = [];
        this.carregando = false;

        if (erro.status === 404) {
          this.mensagemErro = 'Portfólio público não encontrado.';
        } else if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end.';
        } else {
          this.mensagemErro = `Erro ao carregar portfólio público. Código: ${erro.status}`;
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

  textoCurso(projeto: PortfolioProjetoPublico): string {
    if (projeto.sigla_curso) {
      return projeto.sigla_curso;
    }

    if (projeto.curso) {
      return projeto.curso;
    }

    return 'Curso não informado';
  }
}