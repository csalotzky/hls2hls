import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StreamAddComponent } from './stream-add/stream-add.component';
import { StreamListComponent } from './stream-list/stream-list.component';
import { WatchComponent } from './watch/watch.component';
import { StreamDeleteComponent } from './stream-delete/stream-delete.component';

import { VgCoreModule } from 'videogular2/compiled/core';
import { VgControlsModule } from 'videogular2/compiled/controls';
import { VgOverlayPlayModule } from 'videogular2/compiled/overlay-play';
import { VgBufferingModule } from 'videogular2/compiled/buffering';
import { VgStreamingModule } from 'videogular2/compiled/streaming';

import { JwtModule } from '@auth0/angular-jwt';
import { LoginComponent } from './login/login.component';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { StreamManageComponent } from './stream-manage/stream-manage.component';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { FilesizePipe } from './filesize.pipe';

const config: SocketIoConfig = { url: window.location.origin, options: {} };


export function adminTokenGetter() {
  return localStorage.getItem('admin_token');
}

@NgModule({
  declarations: [
    AppComponent,
    StreamAddComponent,
    StreamListComponent,
    WatchComponent,
    StreamDeleteComponent,
    LoginComponent,
    StreamManageComponent,
    FilesizePipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,
    VgStreamingModule,
    SocketIoModule.forRoot(config),
    JwtModule.forRoot({
      config: {
        tokenGetter: adminTokenGetter,
        whitelistedDomains: [window.location.host],
      blacklistedRoutes: [/.*\/api\/acknowledgements/, /.*\/api\/streams\/.*\/.*/ ]
      }
    }),
  ],
  providers: [
    AuthService,
    AuthGuard  
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
