import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/*
  Componente Sidebar.
  Ele recebe o "perfil" do usuário e mostra o menu que corresponde.
*/
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  /*
    Perfil recebido pela página.
    Exemplo: aluno, professor ou coordenador.
  */
  @Input() perfil: 'aluno' | 'professor' | 'coordenador' = 'aluno';

  /*
    Retorna os itens do menu conforme o perfil.
    pra aproveitar a mesma sidebar para geral.
  */
  get menuItens() {
    if (this.perfil === 'professor') {
      return [
        { label: 'Fila de Aprovação', icon: 'bi-clipboard-check', route: '/professor/fila-aprovacao' },
        { label: 'Meus Orientandos', icon: 'bi-people', route: '/professor/orientandos' },
        { label: 'Vitrine', icon: 'bi-grid', route: '/professor/vitrine' },
        { label: 'Histórico de Avaliações', icon: 'bi-clock-history', route: '/professor/historico-avaliacoes' },
        { label: 'Notificações', icon: 'bi-bell', route: '/professor/notificacoes' }
      ];
    }

    if (this.perfil === 'coordenador') {
      return [
        { label: 'Dashboard', icon: 'bi-speedometer2', route: '/coordenador/dashboard' },
        { label: 'Gestão de Usuários', icon: 'bi-people', route: '/coordenador/usuarios' },
        { label: 'Gestão de Projetos', icon: 'bi-folder2-open', route: '/coordenador/projetos' },
        { label: 'Vitrine', icon: 'bi-grid', route: '/coordenador/vitrine' },
        { label: 'Tags / Tecnologias', icon: 'bi-tags', route: '/coordenador/tags' },
        { label: 'Exportar Relatórios', icon: 'bi-file-earmark-pdf', route: '/coordenador/relatorios' },
        { label: 'Notificações', icon: 'bi-bell', route: '/coordenador/notificacoes' }
      ];
    }

    return [
      { label: 'Vitrine', icon: 'bi-grid', route: '/aluno/vitrine' },
      { label: 'Meus Projetos', icon: 'bi-folder', route: '/aluno/meus-projetos' },
      { label: 'Meu Portfólio', icon: 'bi-person-badge', route: '/aluno/portfolio' },
      { label: 'Notificações', icon: 'bi-bell', route: '/aluno/notificacoes' }
    ];
  }
}