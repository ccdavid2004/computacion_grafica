import { Component } from '@angular/core';
import { Header } from './components/header/header';
import { Content } from './components/content/content';
import { SideBar } from './components/side-bar/side-bar';
import { Footer } from './components/footer/footer';

@Component({
  imports: [Header, Content, SideBar, Footer],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  title = 'componentes-ts';
}
