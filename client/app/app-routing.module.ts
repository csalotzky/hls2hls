import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StreamAddComponent } from './stream-add/stream-add.component';
import { StreamListComponent } from './stream-list/stream-list.component';
import { StreamManageComponent } from './stream-manage/stream-manage.component';
import { WatchComponent } from './watch/watch.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './auth.guard';


const routes: Routes = [
  {path: 'stream-add', component: StreamAddComponent, canActivate: [AuthGuard]},
  {path: 'stream-add/:id', component: StreamAddComponent, canActivate: [AuthGuard]},
  {path: 'stream-remove/:id', component: StreamAddComponent, canActivate: [AuthGuard]},
  {path: 'stream-list', component: StreamListComponent},
  {path: 'stream-manage', component: StreamManageComponent, canActivate: [AuthGuard]},
  {path: '', component: StreamListComponent},
  {path: 'watch/:id', component: WatchComponent},
  {path: 'login', component: LoginComponent}, 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }