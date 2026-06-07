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
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MediaConfigurationComponent } from '../media-configuration';
import { MediaService } from '@watch-together/shared';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'lib-video',
    imports: [CommonModule, MediaConfigurationComponent, FontAwesomeModule, MatDialogModule],
    standalone: true,
    templateUrl: './video.component.html',
    styleUrl: './video.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoComponent {
    readonly localVideo = viewChild.required<ElementRef<HTMLVideoElement>>('localVideo');
    public readonly audioDevices = computed(() => this.mediaService.audioDevices());
    public readonly videoDevices = computed(() => this.mediaService.videoDevices());

    protected readonly faEdit = faEdit;

    private readonly mediaService = inject(MediaService);
    private modalRef: MatDialogRef<any> | undefined;
    private readonly dialog = inject(MatDialog);

    public setVideo(stream: MediaStream): void {
        const videoElement = this.localVideo().nativeElement;
        videoElement.srcObject = stream;
        videoElement.muted = true;
    }

    public openVideoSettings(templateRef: TemplateRef<any>): void {
        // open the provided template in a Material dialog
        this.modalRef = this.dialog.open(templateRef);
    }

    public close(): void {
        this.modalRef?.close();
    }
}
