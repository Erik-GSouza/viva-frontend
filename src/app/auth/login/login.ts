import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService, UsuarioLogado } from '../../services/auth.service';

@Component({
  selector: 'app-login',

  /*
    FormsModule é necessário pq usa [(ngModel)] no HTML

    O [(ngModel)] é o que faz o input do HTML conversar com as variáveis
    do TypeScript, como email e senha.
  */
  imports: [FormsModule],

  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  /*
    Essas duas variáveis guardam o que o usuário digita nos campos
    de email e senha da tela de login.
  */
  email = '';
  senha = '';

  /*
    Essa variável serve para controlar o botão enquanto o login está acontecendo

    Ex:
    - carregando = true  → mostra "Entrando..."
    - carregando = false → mostra "Entrar"
  */
  carregando = false;

  /*
    Essa variável guarda uma mensagem de erro para mostrar na tela

    Ex:
    "Email ou senha inválidos."
  */
  mensagemErro = '';

  constructor(
    /*
      O Router serve para mandar o usuário para outra página depois do login

      Ex:
      se for aluno, manda para /aluno/projetos
    */
    private router: Router,

    /*
      O AuthService conversa com o back na parte de login

      Ele chama o endpoint:
      POST /api/v1/login
    */
    private authService: AuthService
  ) {}

  /*
    função chamada quando o user clica no botão "Entrar".

    faz 4 coisas principais:
    1. Verifica se o email e a senha foram preenchidos
    2. Envia esses dados para o back
    3. Salva o usuário logado no localStorage
    4. Redireciona o usuário conforme o perfil dele
  */
  entrar() {
    /*
      Sempre que tentar entrar, limpa a mensagem de erro anterior
      Assim a tela não fica mostrando erro antigo
    */
    this.mensagemErro = '';

    /*
      Validação simples:
      se o usuário não digitou email ou senha, nem chama o back
    */
    if (!this.email || !this.senha) {
      this.mensagemErro = 'Informe o e-mail e a senha.';
      return;
    }

    /*
      Aqui avisa para a tela que o login começou.
      ajuda a mudar o texto do botão para "Entrando..."
      ai evita vários cliques seguidos
    */
    this.carregando = true;

    /*
      Aqui chama o back na lata

      O Angular envia:
      {
        email: "...",
        senha: "..."
      }

      Para o endpoint:
      POST http://127.0.0.1:8000/api/v1/login
    */
    this.authService.login({
      email: this.email,
      senha: this.senha
    }).subscribe({
      /*
        O next acontece quando o back responde com sucesso

        basicamente:
        o email e a senha estavam corretos.
      */
      next: (usuario) => {
        console.log('Resposta do login:', usuario);

        this.carregando = false;

        /*
          Salva o usuário logado no navegador.

          as outras telas podem precisam saber:
          - quem está logado
          - qual é o perfil
          - qual é o id do usuário
        */
        this.authService.salvarUsuario(usuario);

        /*
          descobrir se o usuário é:
          aluno, professor, coordenador ou admin
        */
        const perfil = this.identificarPerfil(usuario);

        /*
          Depois de descobrir o perfil, manda cada tipo de usuário
          para a tela inicial correta
        */
        if (perfil === 'aluno') {
          this.router.navigate(['/aluno/projetos']);
          return;
        }

        if (perfil === 'professor') {
          this.router.navigate(['/professor/fila-aprovacao']);
          return;
        }

        if (perfil === 'coordenador') {
          this.router.navigate(['/coordenador/dashboard']);
          return;
        }

        if (perfil === 'administrador') {
          this.router.navigate(['/administrador/usuarios']);
          return;
        }

        /*
          Se chegoar ate aqui significa que o login funcionou,
          mas o perfil veio em um formato que o front não reconheceu
        */
        this.mensagemErro = 'Perfil do usuário não reconhecido.';
      },

      /*
        O error acontece quando o back responde com erro

        Ex:
        - email errado
        - senha errada
        - usuário inativo
        - back fora do ar
      */
      error: (erro) => {
        console.log('Erro ao tentar fazer login:', erro);

        this.carregando = false;
        this.mensagemErro = 'Não foi possível fazer login. Verifique o back-end e tente novamente.';
      }
    });
  }

  /*
    Essa função tenta descobrir o perfil do user.

    ela foi feita  mais flexivel porque o back pode retornar
    o perfil de formas diferentes, ex:

    perfil: "Aluno"
    nome_perfil: "Aluno"
    id_perfil: 1

    Ai o front fica mais resistente e não quebra fácil
  */
  private identificarPerfil(usuario: UsuarioLogado): string {
    /*
      Primeiro tenta pegar o perfil em formato de texto

      Ex:
      "Aluno"
      "Professor"
      "Coordenador"
      "Administrador"
    */
    const perfilTexto = usuario.perfil || usuario.nome_perfil;

    if (perfilTexto) {
      /*
        Aqui deixa o texto padronizado

        Ex:
        "Administrador" vira "administrador"
        "Coordenador" vira "coordenador"

        tambem removemos acentos, caso apareça algum.
      */
      return perfilTexto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }

    /*
      Se o perfil não veio como texto, tenta identificar pelo id_perfil

      No nosso banco:
      1 = Aluno
      2 = Professor
      3 = Coordenador
      4 = Administrador
    */
    if (usuario.id_perfil === 1) {
      return 'aluno';
    }

    if (usuario.id_perfil === 2) {
      return 'professor';
    }

    if (usuario.id_perfil === 3) {
      return 'coordenador';
    }

    if (usuario.id_perfil === 4) {
      return 'administrador';
    }

    /*
      Se não conseguiu identificar de jeito nenhum, retorna vazio.
    */
    return '';
  }
}