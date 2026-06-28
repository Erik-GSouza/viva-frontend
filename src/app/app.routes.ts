import { Routes } from '@angular/router';

import { Login } from './auth/login/login';
import { AlunoProjetos } from './aluno/projetos/projetos';
import { FilaAprovacao } from './professor/fila-aprovacao/fila-aprovacao';
import { ProfessorProjetoDetalhes } from './professor/projeto-detalhes/projeto-detalhes';
import { ProfessorNotificacoes } from './professor/notificacoes/notificacoes';
import { ProfessorHistoricoRevisoes } from './professor/historico-revisoes/historico-revisoes';
import { Dashboard } from './coordenador/dashboard/dashboard';
import { CoordenadorProjetos } from './coordenador/projetos/projetos';
import { AlunoProjetoDetalhes } from './aluno/projeto-detalhes/projeto-detalhes';
import { AlunoNotificacoes } from './aluno/notificacoes/notificacoes';
import { AlunoPortfolio } from './aluno/portfolio/portfolio';
import { AlunoSubmeterProjeto } from './aluno/submeter-projeto/submeter-projeto';
import { AdministradorUsuarios } from './administrador/usuarios/usuarios';
import { AdministradorCursos } from './administrador/cursos/cursos';
import { AdministradorTurmas } from './administrador/turmas/turmas';
import { AdministradorTags } from './administrador/tags/tags';
import { AdministradorCompetencias } from './administrador/competencias/competencias';
import { VitrinePublica } from './publico/vitrine-publica/vitrine-publica';
import { ProjetoPublicoDetalhes } from './publico/projeto-publico-detalhes/projeto-publico-detalhes';
import { PortfolioPublicoComponent } from './publico/portfolio-publico/portfolio-publico';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'vitrine',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'aluno/projetos',
    component: AlunoProjetos,
    canActivate: [authGuard],
    data: {
      perfisPermitidos: [1]
    }
  },
  {
    path: 'aluno/projetos/:id',
    component: AlunoProjetoDetalhes,
    canActivate: [authGuard],
    data: {
      perfisPermitidos: [1]
    }
  },
  {
    path: 'aluno/notificacoes',
    component: AlunoNotificacoes,
    canActivate: [authGuard],
    data: {
      perfisPermitidos: [1]
    }
  },
  {
    path: 'aluno/portfolio',
    component: AlunoPortfolio,
    canActivate: [authGuard],
    data: {
      perfisPermitidos: [1]
    }
  },
  {
    path: 'aluno/submeter-projeto',
    component: AlunoSubmeterProjeto,
    canActivate: [authGuard],
    data: {
      perfisPermitidos: [1]
    }
  },
  {
    path: 'professor/fila-aprovacao',
    component: FilaAprovacao,
    canActivate: [authGuard],
    data: {
      perfisPermitidos: [2]
    }
  },
  {
    path: 'professor/projetos/:id',
    component: ProfessorProjetoDetalhes,
    canActivate: [authGuard],
    data: {
      perfisPermitidos: [2]
    }
  },
  {
    path: 'professor/notificacoes',
    component: ProfessorNotificacoes,
    canActivate: [authGuard],
    data: {
      perfisPermitidos: [2]
    }
  },
  {
    path: 'professor/historico-revisoes',
    component: ProfessorHistoricoRevisoes,
    canActivate: [authGuard],
    data: {
      perfisPermitidos: [2]
    }
  },
  {
    path: 'coordenador/dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    data: {
      perfisPermitidos: [3]
    }
  },
  {
    path: 'coordenador/projetos',
    component: CoordenadorProjetos,
    canActivate: [authGuard],
    data: {
      perfisPermitidos: [3]
    }
  },
  {
    path: 'administrador/usuarios',
    component: AdministradorUsuarios,
    canActivate: [authGuard],
    data: {
      perfisPermitidos: [4]
    }
  },
  {
    path: 'administrador/cursos',
    component: AdministradorCursos,
    canActivate: [authGuard],
    data: {
      perfisPermitidos: [4]
    }
  },
  {
    path: 'administrador/turmas',
    component: AdministradorTurmas,
    canActivate: [authGuard],
    data: {
      perfisPermitidos: [4]
    }
  },
  {
    path: 'administrador/tags',
    component: AdministradorTags,
    canActivate: [authGuard],
    data: {
      perfisPermitidos: [4]
    }
  },
  {
    path: 'administrador/competencias',
    component: AdministradorCompetencias,
    canActivate: [authGuard],
    data: {
      perfisPermitidos: [4]
    }
  },
  {
    path: 'vitrine',
    component: VitrinePublica
  },
  {
    path: 'vitrine/:slug_publico',
    component: ProjetoPublicoDetalhes
  },
  {
    path: 'portfolio/:slug_publico',
    component: PortfolioPublicoComponent
  },  
  {
    path: '**',
    redirectTo: 'vitrine'
  }
];