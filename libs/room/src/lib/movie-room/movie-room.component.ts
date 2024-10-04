import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextChatComponent } from '@watch-together/chat';
import { SocketService, VideoPlayerComponent } from '@watch-together/video-player';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'lib-movie-room',
  standalone: true,
  imports: [CommonModule, TextChatComponent, VideoPlayerComponent],
  templateUrl: './movie-room.component.html',
  styleUrl: './movie-room.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MovieRoomComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private socketService = inject(SocketService<any>);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      console.warn('params', params);
      this.socketService.emit('createRoom', () => {

      });
    });
  }
}
