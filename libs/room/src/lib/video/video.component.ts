import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEdit } from '@fortawesome/free-regular-svg-icons';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { MediaConfigurationComponent } from '../media-configuration/media-configuration.component';
import { MediaService } from '@watch-together/utils';
import { Observable } from 'rxjs';

@Component({
  selector: 'lib-video',
  standalone: true,
  imports: [CommonModule, FaIconComponent, MediaConfigurationComponent],
  providers: [BsModalService],
  templateUrl: './video.component.html',
  styleUrl: './video.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoComponent implements AfterViewInit {

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  public audioDevices$!: Observable<MediaDeviceInfo[]>;
  public videoDevices$!: Observable<MediaDeviceInfo[]>;
  protected readonly faEdit = faEdit;
  private mediaService = inject(MediaService);
  private modalRef = inject(BsModalRef);
  private modalService = inject(BsModalService);

  ngAfterViewInit(): void {
    console.error('AfterViewInit');

    this.audioDevices$ = this.mediaService.getAudioSettings();
    this.videoDevices$ = this.mediaService.getCameraSettings();
  }

  public setVideo(stream: MediaStream): void {
    const videoElement = this.localVideo.nativeElement;
    videoElement.srcObject = stream;
  }

  public openVideoSettings(templateRef: TemplateRef<any>): void {
    this.modalRef = this.modalService.show(templateRef);
  }

  public close(): void {
    this.modalRef.hide();
  }
}
