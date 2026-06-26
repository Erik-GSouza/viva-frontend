import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';
import { ApiService } from '../../services/api.service';
import { AuthService, UsuarioLogado } from '../../services/auth.service';

/*
  Turma vinda do back
*/
interface Turma {
  id_turma: number;
  id_curso: number;
  nome: string;
  semestre: string;
  ano: number;
  turno: string;
  status: string;
}

/*
  Usuário vindo do back
*/
interface Usuario {
  id_usuario: number;
  id_perfil: number;
  id_turma?: number | null;
  nome: string;
  email: string;
  status: string;
}

/*
  Tags e tecnologias cadastradas no sistema
*/
interface TagTecnologia {
  id_tag: number;
  nome: string;
  categoria: string;
  cor?: string | null;
  status: string;
}

/*
  Competências cadastradas no sistema
*/
interface Competencia {
  id_competencia: number;
  nome: string;
  descricao?: string | null;
  categoria: string;
  status: string;
}

/*
  Projeto retornado pelo back
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
  selector: 'app-aluno-submeter-projeto',
  imports: [Sidebar, Topbar, FormsModule, RouterLink],
  templateUrl: './submeter-projeto.html',
  styleUrl: './submeter-projeto.css'
})
export class AlunoSubmeterProjeto implements OnInit {
  usuarioLogado: UsuarioLogado | null = null;

  turmas: Turma[] = [];
  professores: Usuario[] = [];
  tags: TagTecnologia[] = [];
  competencias: Competencia[] = [];

  carregando = true;
  salvando = false;
  mensagemErro = '';
  mensagemSucesso = '';

  /*
    Dados do form
  */
  titulo = '';
  descricao = '';
  problema = '';
  solucao = '';

  idTurma: number | null = null;
  idProfessorOrientador: number | null = null;

  tagsSelecionadas: number[] = [];
  competenciasSelecionadas: number[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
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

    /*
      Se o aluno tiver turma vinculada no login já deixa selecionada
    */
    this.idTurma = this.usuarioLogado.id_turma || null;

    this.carregarDadosDoFormulario();
  }

  carregarDadosDoFormulario(): void {
    this.carregando = true;
    this.mensagemErro = '';

    /*
      Busca os dados reais necessários para montar o form
    */
    forkJoin({
      turmas: this.apiService.get<Turma[]>('/turmas'),
      usuarios: this.apiService.get<Usuario[]>('/usuarios'),
      tags: this.apiService.get<TagTecnologia[]>('/tags'),
      competencias: this.apiService.get<Competencia[]>('/competencias')
    }).subscribe({
      next: (resposta) => {
        this.turmas = resposta.turmas.filter((turma) => turma.status === 'ativo');

        /*
          Perfil 2 = Professor
        */
        this.professores = resposta.usuarios.filter(
          (usuario) => usuario.id_perfil === 2 && usuario.status === 'ativo'
        );

        this.tags = resposta.tags.filter((tag) => tag.status === 'ativo');

        this.competencias = resposta.competencias.filter(
          (competencia) => competencia.status === 'ativo'
        );

        this.carregando = false;
        this.changeDetector.detectChanges();
      },

      error: (erro) => {
        this.carregando = false;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end. Verifique se o FastAPI está rodando.';
        } else {
          this.mensagemErro = `Erro ao carregar dados do formulário. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  alternarTag(idTag: number, event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.checked) {
      this.tagsSelecionadas.push(idTag);
      return;
    }

    this.tagsSelecionadas = this.tagsSelecionadas.filter((id) => id !== idTag);
  }

  alternarCompetencia(idCompetencia: number, event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.checked) {
      this.competenciasSelecionadas.push(idCompetencia);
      return;
    }

    this.competenciasSelecionadas = this.competenciasSelecionadas.filter(
      (id) => id !== idCompetencia
    );
  }

  formularioValido(): boolean {
    return (
      this.titulo.trim().length > 0 &&
      this.descricao.trim().length > 0 &&
      this.idTurma !== null &&
      this.idProfessorOrientador !== null
    );
  }

  submeterProjeto(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (!this.usuarioLogado) {
      this.mensagemErro = 'Nenhum usuário logado foi encontrado.';
      return;
    }

    if (!this.formularioValido()) {
      this.mensagemErro = 'Preencha título, descrição, turma e professor orientador.';
      return;
    }

    this.salvando = true;

    /*
      Payload que o back espera no POST /projetos
    */
    const novoProjeto = {
      id_turma: Number(this.idTurma),
      id_usuario_submissor: this.usuarioLogado.id_usuario,
      id_professor_orientador: Number(this.idProfessorOrientador),
      titulo: this.titulo.trim(),
      descricao: this.descricao.trim(),
      problema: this.problema.trim() || null,
      solucao: this.solucao.trim() || null,

      /*
        Projeto recém submetido começa como pendente
      */
      status: 'pendente',

      /*
        Publicação fica 0 porque o coordenador/professor ainda não aprovou/publicou
      */
      publicado: 0,
      slug_publico: null
    };

    this.apiService.post<Projeto>('/projetos', novoProjeto).subscribe({
      next: (projetoCriado) => {
        this.criarRelacionamentosDoProjeto(projetoCriado);
      },

      error: (erro) => {
        this.salvando = false;

        if (erro.status === 0) {
          this.mensagemErro = 'Não foi possível conectar ao back-end. Verifique se o FastAPI está rodando.';
        } else {
          this.mensagemErro = `Erro ao submeter projeto. Código: ${erro.status}`;
        }

        this.changeDetector.detectChanges();
      }
    });
  }

  criarRelacionamentosDoProjeto(projeto: Projeto): void {
    const requisicoes = [];

    /*
      Adiciona o próprio aluno como autor/integrante do projeto
    */
    requisicoes.push(
      this.apiService.post(`/projetos/${projeto.id_projeto}/integrantes`, {
        id_usuario: this.usuarioLogado?.id_usuario,
        funcao: 'Autor'
      })
    );

    /*
      Cria a versão inicial do projeto
      útil depois para o professor avaliar versões
    */
    requisicoes.push(
      this.apiService.post(`/projetos/${projeto.id_projeto}/versoes`, {
        numero_versao: 1,
        descricao_alteracao: 'Submissão inicial do projeto.',
        status_versao: 'submetida'
      })
    );

    /*
      Vincula as tags selecionadas
    */
    for (const idTag of this.tagsSelecionadas) {
      requisicoes.push(
        this.apiService.post(`/projetos/${projeto.id_projeto}/tags`, {
          id_tag: idTag
        })
      );
    }

    /*
      Vincula as competências selecionadas
      nível básico pro MVP
    */
    for (const idCompetencia of this.competenciasSelecionadas) {
      requisicoes.push(
        this.apiService.post(`/projetos/${projeto.id_projeto}/competencias`, {
          id_competencia: idCompetencia,
          nivel: 'basico'
        })
      );
    }

    /*
      Se por algum motivo não houver relacionamento, ainda assim finaliza
      Mas normalmente sempre tem que ter pelo menos integrante e versão
    */
    const chamadaFinal = requisicoes.length > 0 ? forkJoin(requisicoes) : of([]);

    chamadaFinal.subscribe({
      next: () => {
        this.salvando = false;
        this.mensagemSucesso = 'Projeto submetido com sucesso.';

        this.changeDetector.detectChanges();

        /*
          Depois de criar, volta para Meus Projetos
          o aluno já vê o projeto novo na lista
        */
        setTimeout(() => {
          this.router.navigate(['/aluno/projetos']);
        }, 900);
      },

      error: (erro) => {
        this.salvando = false;

        /*
          O projeto principal foi criado, mas algum vínculo/dado etc falhou.
          Então avisamos sem esconder que a submissão principal deu certo
        */
        this.mensagemErro = `O projeto foi criado, mas houve erro ao vincular alguns dados. Código: ${erro.status}`;

        this.changeDetector.detectChanges();
      }
    });
  }
}