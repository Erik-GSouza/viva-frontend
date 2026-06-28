import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';

/*
  Guard de autenticação e perfil.

  protege rotas privadas do sistema
  Também impede que um perfil acesse a área de outro.

  Ex:
  - aluno não entra em /professor
  - professor não entra em /administrador
  - usuário sem login volta para /login
*/
export const authGuard: CanActivateFn = (route): boolean | UrlTree => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const usuario = authService.buscarUsuario();

  if (!usuario) {
    return router.createUrlTree(['/login']);
  }

  const perfisPermitidos = route.data['perfisPermitidos'] as number[] | undefined;

  /*
    Se a rota não informar perfisPermitidos, só tá logado
  */
  if (!perfisPermitidos || perfisPermitidos.length === 0) {
    return true;
  }

  const perfilPermitido = perfisPermitidos.includes(usuario.id_perfil);

  if (perfilPermitido) {
    return true;
  }

  /*
    Se o user tentar entrar numa área que não é dele
    manda para a tela inicial correta do próprio perfil
  */
  if (usuario.id_perfil === 1) {
    return router.createUrlTree(['/aluno/projetos']);
  }

  if (usuario.id_perfil === 2) {
    return router.createUrlTree(['/professor/fila-aprovacao']);
  }

  if (usuario.id_perfil === 3) {
    return router.createUrlTree(['/coordenador/dashboard']);
  }

  if (usuario.id_perfil === 4) {
    return router.createUrlTree(['/administrador/usuarios']);
  }

  return router.createUrlTree(['/login']);
};