import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextChatComponent } from '@watch-together/chat';
import { VideoPlayerComponent } from '@watch-together/video-player';
import { ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs';
import { CommonSocketService } from '@watch-together/utils';

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
  private socketService = inject(CommonSocketService);

  ngOnInit(): void {
    this.route.params.pipe(filter((params) => !!params)).subscribe(params => {
      console.log('params', params);
      // this.emit('createRoom', params['roomId']);
    });
  }

  // emit(eventGroup: 'createRoom', data: string): void {
  //   // this.socketService.emit(eventGroup, data);
  // }
}
