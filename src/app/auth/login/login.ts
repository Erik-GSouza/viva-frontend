import { Component } from '@angular/core';
import { Router } from '@angular/router';

/*
  Criamos um tipo chamado Perfil para limitar os perfis possíveis.
  Assim evita escrever qualquer texto errado, como "alunoo" ou "prof".
*/
type Perfil = 'aluno' | 'professor' | 'coordenador';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  /*
    Perfil selecionado inicialmente.
    Quando a tela abre, o perfil "aluno" já vem selecionado por padrão.
  */
  perfilSelecionado: Perfil = 'aluno';

  /*
    O Router é usado para navegar entre páginas pelo TypeScript.
    Exemplo: ao clicar em "Entrar", mandamos o usuário para a rota correta.
  */
  constructor(private router: Router) {}

  /*
    Função chamada quando o usuário clica em Aluno, Professor ou Coordenador.
    Ela apenas troca o perfil selecionado na tela.
  */
  selecionarPerfil(perfil: Perfil) {
    this.perfilSelecionado = perfil;
  }

  /*
    Função chamada quando o usuário clica no botão "Entrar".
  */
  entrar() {
    if (this.perfilSelecionado === 'aluno') {
      this.router.navigate(['/aluno/vitrine']);
      return;
    }

    if (this.perfilSelecionado === 'professor') {
      this.router.navigate(['/professor/fila-aprovacao']);
      return;
    }

    this.router.navigate(['/coordenador/dashboard']);
  }
}