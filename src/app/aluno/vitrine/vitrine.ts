import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';

/*
  Página inicial do aluno.
*/
@Component({
  selector: 'app-vitrine',
  imports: [Sidebar, Topbar, RouterLink],
  templateUrl: './vitrine.html',
  styleUrl: './vitrine.css'
})
export class Vitrine {}