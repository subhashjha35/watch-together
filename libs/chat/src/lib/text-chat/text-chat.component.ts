import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  OnInit,
  QueryList,
  runInInjectionContext,
  viewChild,
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService, IChatDataExtended } from '../chat.service';
import { BehaviorSubject, filter, map, Observable, of, startWith, Subject, tap, withLatestFrom } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpandableContainerComponent, IChat } from '@watch-together/shared';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lib-text-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ExpandableContainerComponent],
  templateUrl: './text-chat.component.html',
  styleUrl: './text-chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextChatComponent implements OnInit, AfterViewInit {
  readonly scrollFrame =
    viewChild.required<ElementRef<HTMLDivElement>>('scrollFrame');
  @ViewChildren('item') itemElements!: QueryList<any>;

  readonly ecComponent = viewChild.required<ExpandableContainerComponent>(
    'expandableContainerComponent',
  );

  public chatForm!: FormGroup;
  public registrationForm!: FormGroup;
  public chatHistory$: Observable<IChatDataExtended[]> = of([]);
  public name$ = new BehaviorSubject<string | undefined>(undefined);

  private readonly injector = inject(Injector);
  private scrollContainer!: HTMLDivElement;
  private readonly chatService = inject(ChatService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly chatSubject = new Subject<IChat['dataType']>();
  public chat$: Observable<IChat['dataType']> = this.chatSubject.asObservable();

  ngOnInit() {
    this.chatHistory$ = this.chat$.pipe(
      withLatestFrom(this.chatHistory$),
      filter(([data]) => !!data.text),
      map(([data, chatHistory]) => {
        chatHistory.push(data);
        return chatHistory;
      }),
    );

    this.chatService.on('chat', async (data) => {
      console.log('chat', data);
      this.chatSubject.next(data);
      const audio: HTMLAudioElement = new Audio('./assets/pop-sound.wav');
      await audio.play();
    });

    this.chatForm = this.formBuilder.group({
      textMessage: new FormControl(null, [Validators.required]),
    });

    this.registrationForm = this.formBuilder.group({
      username: new FormControl(null, [Validators.required]),
    });
  }

  sendMessage(event: Event): void {
    event.preventDefault();
    const data: IChat['dataType'] = {
      user: this.name$.value || 'Anonymous',
      text: this.chatForm.controls['textMessage'].value,
    };
    this.chatSubject.next(data);
    this.chatService.emit('chat', data);

    this.chatForm.controls['textMessage'].reset();
  }

  setName(): void {
    this.name$.next(
      this.registrationForm.controls['username'].value || 'Anonymous',
    );
  }

  ngAfterViewInit() {
    runInInjectionContext(this.injector, () => {
      toObservable(this.ecComponent().isOpen)
        .pipe(
          tap(() => console.error()),
          startWith(false),
        )
        .subscribe((isOpen) => {
          if (isOpen) {
            this.scrollContainer = this.scrollFrame().nativeElement;
            this.itemElements.changes.subscribe(() =>
              this.onItemElementsChanged(),
            );
          }
        });
    });
  }

  private onItemElementsChanged(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    this.scrollContainer?.scroll({
      top: this.scrollContainer.scrollHeight,
      left: 0,
      behavior: 'instant',
    });
  }
}
