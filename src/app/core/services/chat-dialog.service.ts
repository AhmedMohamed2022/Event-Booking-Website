import {
  Injectable,
  ComponentRef,
  ApplicationRef,
  ComponentFactoryResolver,
  Injector,
  EmbeddedViewRef,
} from '@angular/core';
import { ChatComponent } from '../../features/chat/chat.component';

@Injectable({
  providedIn: 'root',
})
export class ChatDialogService {
  private dialogComponentRef: ComponentRef<ChatComponent> | null = null;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private appRef: ApplicationRef,
    private injector: Injector
  ) {}

  openChat(userId: string, userName: string) {
    // Close existing chat if any
    this.closeChat();

    // Create and attach new chat component
    const componentRef = this.componentFactoryResolver
      .resolveComponentFactory(ChatComponent)
      .create(this.injector);

    // Set component properties
    componentRef.instance.otherUserId = userId;
    componentRef.instance.otherUserName = userName;
    componentRef.instance.onClose = () => this.closeChat();

    // Attach component to app
    this.appRef.attachView(componentRef.hostView);

    // Get DOM element from component
    const domElem = (componentRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;

    // Add to document body
    document.body.appendChild(domElem);

    // Store reference
    this.dialogComponentRef = componentRef;
  }

  closeChat() {
    if (this.dialogComponentRef) {
      // Detach and destroy component
      this.appRef.detachView(this.dialogComponentRef.hostView);
      this.dialogComponentRef.destroy();
      this.dialogComponentRef = null;
    }
  }
}
