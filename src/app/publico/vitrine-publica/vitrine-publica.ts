import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../services/api.service';

/*
  Essa tela é pública, então ela usa apenas campos que o back libera
  no endpoint /publico/projetos
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

@Component({
  selector: 'app-vitrine-publica',
  imports: [FormsModule, RouterLink],
  templateUrl: './vitrine-publica.html',
  styleUrl: './vitrine-publica.css'
})
export class VitrinePublica implements OnInit {
  projetos: ProjetoPublico[] = [];

  carregando = true;
  mensagemErro = '';

  busca = '';
  curso = '';
  tecnologia = '';
  competencia = '';

  constructor(
    private apiService: ApiService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarProjetos();
  }

  carregarProjetos(): void {
    this.carregando = true;
    this.mensagemErro = '';

    /*
      back aceita filtros opcionais por query string:
      busca, curso, tecnologia e competencia.

      Como ApiService é simplesão, montamos a query manualmente aqui
    */
    const parametros = new URLSearchParams();

    if (this.busca.trim()) {
      parametros.set('busca', this.busca.trim());
    }

    if (this.curso.trim()) {
      parametros.set('curso', this.curso.trim());
    }

    if (this.tecnologia.trim()) {
      parametros.set('tecnologia', this.tecnologia.trim());
    }

    if (this.competencia.trim()) {
      parametros.set('competencia', this.competencia.trim());
    }

    const queryString = parametros.toString();

    const endpoint = queryString
      ? `/publico/projetos?${queryString}`
      : '/publico/projetos';

    this.apiService.get<ProjetoPublico[]>(endpoint).subscribe({
      next: (resposta) => {
        this.projetos = resposta;
        this.carregando = false;
        this.changeDetector.detectChanges();
      },

      error: (erro) => {
        this.projetos = [];
        this.carregando = false;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end. Verifique se o FastAPI está rodando.';
        } else {
          this.mensagemErro = `Erro ao carregar vitrine pública. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  limparFiltros(): void {
    this.busca = '';
    this.curso = '';
    this.tecnologia = '';
    this.competencia = '';

    this.carregarProjetos();
  }

  formatarData(data?: string | null): string {
    if (!data) {
      return '-';
    }

    return new Date(data).toLocaleDateString('pt-BR');
  }

  textoCurso(projeto: ProjetoPublico): string {
    if (projeto.sigla_curso) {
      return projeto.sigla_curso;
    }

    if (projeto.curso) {
      return projeto.curso;
    }

    return 'Curso não informado';
  }
}