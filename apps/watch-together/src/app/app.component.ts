import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { VideoPlayerComponent } from '@watch-together/video-player';
import { TextChatComponent } from '@watch-together/chat';

@Component({
  standalone: true,
  imports: [RouterModule, VideoPlayerComponent, TextChatComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {

}
