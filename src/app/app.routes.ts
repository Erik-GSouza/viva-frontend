import { Routes } from '@angular/router';

import { Login } from './auth/login/login';
import { AlunoProjetos } from './aluno/projetos/projetos';
import { FilaAprovacao } from './professor/fila-aprovacao/fila-aprovacao';
import { Dashboard } from './coordenador/dashboard/dashboard';
import { CoordenadorProjetos } from './coordenador/projetos/projetos';
import { AlunoProjetoDetalhes } from './aluno/projeto-detalhes/projeto-detalhes';

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
    path: 'professor/fila-aprovacao',
    component: FilaAprovacao
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