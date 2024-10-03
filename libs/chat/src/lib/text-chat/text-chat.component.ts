import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService, IChatData, IChatDataExtended } from '../chat.service';
import { Observable, of, Subject } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

const userColor: Record<string, string> = {
  'subhashjha35': '#da4141',
  'rukhsarnaqvi': '#489801',
  'vikaspandey': '#175c7a'
};
const mockData: IChatData[] = [
  { user: 'subhashjha35', text: 'hello' },
  { user: 'rukhsarnaqvi', text: 'hi' },
  { user: 'vikaspandey', text: 'How are you doing?' },
  { user: 'subhashjha35', text: 'hello' },
  { user: 'rukhsarnaqvi', text: 'hi' },
  { user: 'vikaspandey', text: 'How are you doing?' },
  { user: 'subhashjha35', text: 'hello' },
  { user: 'rukhsarnaqvi', text: 'hi' },
  { user: 'vikaspandey', text: 'How are you doing?' },
  { user: 'subhashjha35', text: 'hello' },
  { user: 'rukhsarnaqvi', text: 'hi' },
  { user: 'vikaspandey', text: 'How are you doing?' },
  { user: 'subhashjha35', text: 'hello' },
  { user: 'rukhsarnaqvi', text: 'hi' },
  { user: 'vikaspandey', text: 'How are you doing?' },
  { user: 'subhashjha35', text: 'hello' },
  { user: 'rukhsarnaqvi', text: 'hi' },
  { user: 'vikaspandey', text: 'How are you doing?' }
];

@Component({
  selector: 'lib-text-chat',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './text-chat.component.html',
  styleUrl: './text-chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextChatComponent implements OnInit {
  chatForm!: FormGroup;

  public chatHistory$: Observable<IChatDataExtended[]> = of([]
  );
  private chatService = inject(ChatService);
  private formBuilder = inject(FormBuilder);
  private chatSubject = new Subject<IChatData>();
  public chat$: Observable<IChatData> = this.chatSubject.asObservable();

  ngOnInit() {
    // this.chatHistory$ = this.chat$.pipe(
    //   withLatestFrom(this.chatHistory$),
    //   filter(([data]) => !!data.text),
    //   map(([data, chatHistory]) => {
    //     chatHistory.push(data);
    //     return chatHistory;
    //   })
    // );

    this.chatHistory$ = of(mockData.map((d) => ({ ...d, color: userColor[d.user] || '#000' })));

    this.chatService.on('chat', (data) => {
      console.log('chat', data);
      this.chatSubject.next(data);
    });

    this.chatForm = this.formBuilder.group({
      'textMessage': new FormControl(null, [Validators.required])
    });
  }

  sendMessage(event: Event): void {
    event.preventDefault();
    const data: IChatData = {
      user: 'subhashjha35',
      text: this.chatForm.controls['textMessage'].value
    };
    this.chatSubject.next(data);
    this.chatService.emit('chat', data);
  }
}
