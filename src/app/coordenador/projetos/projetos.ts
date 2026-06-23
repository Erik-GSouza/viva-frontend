import { Component } from '@angular/core';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';

/*
  tipo criado para organizar os dados dos projetos
  Como ainda não temos back-end esses dados serão mockados/provisórios
*/
type ProjetoStatus =
  | 'Pendente'
  | 'Em análise'
  | 'Revisão solicitada'
  | 'Reenviado'
  | 'Aprovado'
  | 'Rejeitado';

interface Projeto {
  id: number;
  titulo: string;
  responsavel: string;
  curso: string;
  semestre: string;
  orientador: string;
  dataEnvio: string;
  status: ProjetoStatus;
  statusClasse: string;
}

/*
  pagina Gestão de Projetos
  o coordenador usa essa tela para acompanhar todos os projetos da plataforma
*/
@Component({
  selector: 'app-coordenador-projetos',
  imports: [Sidebar, Topbar],
  templateUrl: './projetos.html',
  styleUrl: './projetos.css'
})
export class CoordenadorProjetos {
  /*
    lista provisória de projetos.
    depois esses dados virão do banco de dados pelo back-end
  */
  projetos: Projeto[] = [
    {
      id: 1,
      titulo: 'SaúdeConnect',
      responsavel: 'Ana Beatriz Ferreira',
      curso: 'ADS',
      semestre: '6º Semestre · 2025',
      orientador: 'Prof. Carlos Mendes',
      dataEnvio: '10/11/2025',
      status: 'Aprovado',
      statusClasse: 'approved'
    },
    {
      id: 2,
      titulo: 'RecifeMaps',
      responsavel: 'Gabriel Nascimento',
      curso: 'ADS',
      semestre: '4º Semestre · 2025',
      orientador: 'Prof. Rafael Oliveira',
      dataEnvio: '15/11/2025',
      status: 'Revisão solicitada',
      statusClasse: 'review'
    },
    {
      id: 3,
      titulo: 'EducaLab',
      responsavel: 'Larissa Costa',
      curso: 'Design',
      semestre: '3º Semestre · 2025',
      orientador: 'Prof. Carla Souza',
      dataEnvio: '18/11/2025',
      status: 'Pendente',
      statusClasse: 'pending'
    },
    {
      id: 4,
      titulo: 'FoodShare',
      responsavel: 'Mateus Henrique',
      curso: 'Gestão',
      semestre: '2º Semestre · 2025',
      orientador: 'Prof. Denise Lima',
      dataEnvio: '20/11/2025',
      status: 'Reenviado',
      statusClasse: 'resent'
    }
  ];
}