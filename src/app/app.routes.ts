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

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'aluno/projetos',
    component: AlunoProjetos
  },
  {
    path: 'aluno/projetos/:id',
    component: AlunoProjetoDetalhes
  },
  {
    path: 'aluno/notificacoes',
    component: AlunoNotificacoes
  },
  {
    path: 'aluno/portfolio',
    component: AlunoPortfolio
  },
  {
    path: 'aluno/submeter-projeto',
    component: AlunoSubmeterProjeto
  },
  {
    path: 'professor/fila-aprovacao',
    component: FilaAprovacao
  },
  {
    path: 'professor/projetos/:id',
    component: ProfessorProjetoDetalhes
  },
  {
    path: 'professor/notificacoes',
    component: ProfessorNotificacoes
  },
  {
    path: 'professor/historico-revisoes',
    component: ProfessorHistoricoRevisoes
  },
  {
    path: 'coordenador/dashboard',
    component: Dashboard
  },
  {
    path: 'coordenador/projetos',
    component: CoordenadorProjetos
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];