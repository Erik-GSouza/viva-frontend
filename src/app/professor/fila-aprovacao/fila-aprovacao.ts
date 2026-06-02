import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';

/*
  Página inicial do professor
*/
@Component({
  selector: 'app-fila-aprovacao',
  imports: [Sidebar, Topbar, RouterLink],
  templateUrl: './fila-aprovacao.html',
  styleUrl: './fila-aprovacao.css'
})
export class FilaAprovacao {}