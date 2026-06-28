import { Component, Input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../services/auth.service';

/*
  Tipo simples para os itens do menu

  Cada item da sidebar precisa ter:
  - label: texto que aparece na tela
  - icon: classe do Bootstrap Icons
  - route: rota para onde o usuário vai ao clicar
*/
interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

/*
  Tipos de perfil que a sidebar aceita

*/
type PerfilUsuario = 'aluno' | 'professor' | 'coordenador' | 'administrador';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  /*
    A pag que usa a sidebar informa qual é o perfil

    Ex:
    <app-sidebar perfil="aluno"></app-sidebar>
    <app-sidebar perfil="coordenador"></app-sidebar>
  */
  @Input() perfil: PerfilUsuario = 'aluno';

  /*
    Chama o AuthService para remover o usuário logado
    e o Router pra mandar o usuário de volta para o login.
  */
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  /*
    Faz logout do usuário.

    clicar em sair:
    - remove o usuário salvo no localStorage
    - redireciona para a tela de login
  */
  sair(): void {
    this.authService.sair();
    this.router.navigate(['/login']);
  }

  /*
    Retorna os itens do menu de acordo o perfil do usuário.

    Importante:
    colocamos ": MenuItem[]" para deixar claro para o Angular
    que isso sempre será uma lista de itens válidos.
  */
  get menuItens(): MenuItem[] {
    if (this.perfil === 'professor') {
      return [
        {
          label: 'Fila de Aprovação',
          icon: 'bi-clipboard-check',
          route: '/professor/fila-aprovacao'
        },
        {
          label: 'Histórico de Revisões',
          icon: 'bi-clock-history',
          route: '/professor/historico-revisoes'
        },
        {
          label: 'Notificações',
          icon: 'bi-bell',
          route: '/professor/notificacoes'
        }
      ];
    }

    if (this.perfil === 'coordenador') {
      return [
        {
          label: 'Dashboard',
          icon: 'bi-speedometer2',
          route: '/coordenador/dashboard'
        },
        {
          label: 'Projetos',
          icon: 'bi-folder2-open',
          route: '/coordenador/projetos'
        }
      ];
    }

    if (this.perfil === 'administrador') {
      return [
        {
          label: 'Usuários',
          icon: 'bi-people',
          route: '/administrador/usuarios'
        },
        {
          label: 'Cursos',
          icon: 'bi-journal-bookmark',
          route: '/administrador/cursos'
        },
        {
          label: 'Turmas',
          icon: 'bi-collection',
          route: '/administrador/turmas'
        },
        {
          label: 'Tags',
          icon: 'bi-tags',
          route: '/administrador/tags'
        },
        {
          label: 'Competências',
          icon: 'bi-award',
          route: '/administrador/competencias'
        }
      ];
    }

    /*
      Menu padrão do aluno.

    */
    return [
      {
        label: 'Meus Projetos',
        icon: 'bi-folder',
        route: '/aluno/projetos'
      },
      {
        label: 'Meu Portfólio',
        icon: 'bi-person-badge',
        route: '/aluno/portfolio'
      },
      {
        label: 'Notificações',
        icon: 'bi-bell',
        route: '/aluno/notificacoes'
      }
    ];
  }
}