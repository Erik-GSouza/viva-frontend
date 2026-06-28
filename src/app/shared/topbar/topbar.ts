import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

/*
  Tipo usado para limitar os perfis
  evita escrever perfis errados
*/
type PerfilTipo = 'aluno' | 'professor' | 'coordenador' | 'administrador';

/*
  Topbar
*/
@Component({
  selector: 'app-topbar',
  imports: [RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class Topbar {
  /*
    Título da página atual
    Ex: Vitrine, Dashboard, Gestão de Usuários
  */
  @Input() titulo = 'Página';

  /*
    Nome exibido no canto direito
    Depois esse nome virá do usuário logado
  */
  @Input() nomeUsuario = 'Usuário';

  /*
    Texto visual do perfil
    Ex: Aluno, professor etc
  */
  @Input() perfil = 'Aluno';

  /*
    Tipo real do perfil
    pra montar os links corretos
  */
  @Input() perfilTipo: PerfilTipo = 'aluno';

  /*
    Controla se o menu do usuário está aberto ou fechado
  */
  menuAberto = false;

  /*
    Abre ou fecha o menu do usuário
  */
  alternarMenu() {
    this.menuAberto = !this.menuAberto;
  }

  /*
    Rota da pag de notificações dependendo do perfil
  */
  get notificacoesRoute() {
    return `/${this.perfilTipo}/notificacoes`;
  }

  /*
    Rota da pag de perfil dependendo do perfil
  */
  get perfilRoute() {
    return `/${this.perfilTipo}/perfil`;
  }

  /*
    Rota da pag de configurações dependendo do perfil
  */
  get configuracoesRoute() {
    return `/${this.perfilTipo}/configuracoes`;
  }
}