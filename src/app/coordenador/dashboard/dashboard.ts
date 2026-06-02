import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';

/*
  Página inicial do coordenador
*/
@Component({
  selector: 'app-dashboard',
  imports: [Sidebar, Topbar, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {}