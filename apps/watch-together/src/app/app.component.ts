import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { VideoPlayerComponent } from '@watch-together/video-player';

@Component({
  standalone: true,
  imports: [RouterModule, VideoPlayerComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {

}
