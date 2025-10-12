import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
export class VideoComponent {
  readonly localVideo =
    viewChild.required<ElementRef<HTMLVideoElement>>('localVideo');
  public audioDevices = computed(() => this.mediaService.audioDevices());
  public videoDevices = computed(() => this.mediaService.videoDevices());

  protected readonly faEdit = faEdit;

  private readonly mediaService = inject(MediaService);
  private modalRef = inject(BsModalRef);
  private readonly modalService = inject(BsModalService);

  public setVideo(stream: MediaStream): void {
    const videoElement = this.localVideo().nativeElement;
    videoElement.srcObject = stream;
    videoElement.muted = true;
  }

  public openVideoSettings(templateRef: TemplateRef<any>): void {
    this.modalRef = this.modalService.show(templateRef);
  }

  public close(): void {
    this.modalRef.hide();
  }
}
