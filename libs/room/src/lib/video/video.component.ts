import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  TemplateRef,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { faEdit } from '@fortawesome/free-regular-svg-icons';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { MediaConfigurationComponent } from '../media-configuration';
import { MediaService } from '@watch-together/shared';
import { Observable } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'lib-video',
  standalone: true,
  imports: [CommonModule, MediaConfigurationComponent, FontAwesomeModule],
  providers: [BsModalService],
  templateUrl: './video.component.html',
  styleUrl: './video.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoComponent implements AfterViewInit {
  readonly localVideo =
    viewChild.required<ElementRef<HTMLVideoElement>>('localVideo');
  public audioDevices$!: Observable<MediaDeviceInfo[]>;
  public videoDevices$!: Observable<MediaDeviceInfo[]>;
  protected readonly faEdit = faEdit;

  private readonly mediaService = inject(MediaService);
  private modalRef = inject(BsModalRef);
  private readonly modalService = inject(BsModalService);

  ngAfterViewInit(): void {
    this.audioDevices$ = this.mediaService.getAudioSettings();
    this.videoDevices$ = this.mediaService.getCameraSettings();
  }

  public setVideo(stream: MediaStream): void {
    const videoElement = this.localVideo().nativeElement;
    videoElement.srcObject = stream;
  }

  public openVideoSettings(templateRef: TemplateRef<any>): void {
    this.modalRef = this.modalService.show(templateRef);
  }

  public close(): void {
    this.modalRef.hide();
  }
}
