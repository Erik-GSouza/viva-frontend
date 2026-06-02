import { Routes } from '@angular/router';

import { Login } from './auth/login/login';
import { Vitrine } from './aluno/vitrine/vitrine';
import { FilaAprovacao } from './professor/fila-aprovacao/fila-aprovacao';
import { Dashboard } from './coordenador/dashboard/dashboard';
import { Projetos } from './coordenador/projetos/projetos';

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
    path: 'aluno/vitrine',
    component: Vitrine
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
    component: Projetos
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];