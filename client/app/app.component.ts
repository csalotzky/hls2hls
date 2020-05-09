import { Component } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'HLS2HLS';

  constructor(private authService: AuthService, private router: Router, private jwtHelper: JwtHelperService) {}
    
  logOut() {
    this.authService.logout();
    this.router.navigate(['login']);
  }

  isAdminAuthenticated() {
    let token: string = localStorage.getItem('admin_token');
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      return true;
    }
    else {
      return false;
    }
  }
}
