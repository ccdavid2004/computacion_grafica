import { Component } from '@angular/core';
import { Logo } from '../logo/logo';

@Component({
  imports: [Logo],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {}
