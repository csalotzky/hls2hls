import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<boolean> {
    return this.http.post<{token: string}>('/api/users/authAdmin', {username: username, password: password})
      .pipe(
        map(result => {
          localStorage.setItem('admin_token', result.token);
          return true;
        })
      );
  }

  logout() {
    localStorage.removeItem('admin_token');
  }

  public get loggedIn(): boolean {
    return (localStorage.getItem('admin_token') !== null);
  }
}

