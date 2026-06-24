import {
    _decorator,
    Collider2D,
    Component,
    Contact2DType,
    EventMouse,
    EventTouch,
    input,
    Input,
    IPhysics2DContact,
    Label,
    Node,
    UITransform,
    view,
} from 'cc';
import { PlayerController } from '../controllers/PlayerController';

const { ccclass, property } = _decorator;

@ccclass('DialogueTrigger')
export class DialogueTrigger extends Component {
    @property
    public message = 'ระวังนะ! ทางซ้ายของหมู่บ้านมีป่าที่มีมอนสเตอร์ดุร้ายอยู่';

    @property(Node)
    public dialogueRoot: Node | null = null;

    @property(Label)
    public messageLabel: Label | null = null;

    @property(Node)
    public promptRoot: Node | null = null;

    @property(Node)
    public interactTarget: Node | null = null;

    private collider: Collider2D | null = null;
    private isPlayerNearby = false;
    private pointerStartedOnPrompt = false;

    public onLoad(): void {
        this.collider = this.getComponent(Collider2D);
        this.hideDialogue();
        this.hidePrompt();
    }

    public onEnable(): void {
        this.collider?.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        this.collider?.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        this.bindInteractEvents();
    }

    public onDisable(): void {
        this.collider?.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        this.collider?.off(Contact2DType.END_CONTACT, this.onEndContact, this);
        this.unbindInteractEvents();
    }

    public refreshInteractEvents(): void {
        this.bindInteractEvents();
    }

    private onBeginContact(_self: Collider2D, other: Collider2D, _contact: IPhysics2DContact | null): void {
        if (!other.getComponent(PlayerController)) {
            return;
        }

        this.isPlayerNearby = true;
        if (this.messageLabel) {
            this.messageLabel.string = this.message;
        }

        this.hideDialogue();
        this.showPrompt();
    }

    private onEndContact(_self: Collider2D, other: Collider2D, _contact: IPhysics2DContact | null): void {
        if (other.getComponent(PlayerController)) {
            this.isPlayerNearby = false;
            this.hideDialogue();
            this.hidePrompt();
        }
    }

    private onInteract = (event: EventMouse | EventTouch): void => {
        const shouldOpenDialogue = this.isPlayerNearby
            && this.pointerStartedOnPrompt
            && this.isPromptClick(event);
        this.pointerStartedOnPrompt = false;

        if (!shouldOpenDialogue) {
            return;
        }

        if (this.messageLabel) {
            this.messageLabel.string = this.message;
        }

        this.hidePrompt();
        this.dialogueRoot?.setSiblingIndex(999);
        if (this.dialogueRoot) {
            this.dialogueRoot.active = true;
        }
    };

    private bindInteractEvents(): void {
        this.unbindInteractEvents();
        input.on(Input.EventType.TOUCH_START, this.onPointerStart, this);
        input.on(Input.EventType.TOUCH_END, this.onInteract, this);
        input.on(Input.EventType.MOUSE_DOWN, this.onPointerStart, this);
        input.on(Input.EventType.MOUSE_UP, this.onInteract, this);
    }

    private unbindInteractEvents(): void {
        input.off(Input.EventType.TOUCH_START, this.onPointerStart, this);
        input.off(Input.EventType.TOUCH_END, this.onInteract, this);
        input.off(Input.EventType.MOUSE_DOWN, this.onPointerStart, this);
        input.off(Input.EventType.MOUSE_UP, this.onInteract, this);
    }

    private onPointerStart = (event: EventMouse | EventTouch): void => {
        this.pointerStartedOnPrompt = this.isPlayerNearby && this.isPromptClick(event);
    };

    private hideDialogue(): void {
        if (this.dialogueRoot) {
            this.dialogueRoot.active = false;
        }
    }

    private showPrompt(): void {
        this.promptRoot?.setSiblingIndex(999);
        if (this.promptRoot) {
            this.promptRoot.active = true;
        }
    }

    private hidePrompt(): void {
        this.pointerStartedOnPrompt = false;
        if (this.promptRoot) {
            this.promptRoot.active = false;
        }
    }

    private isPromptClick(event: EventMouse | EventTouch): boolean {
        if (!this.promptRoot?.active) {
            return false;
        }

        const transform = this.promptRoot.getComponent(UITransform);
        if (!transform) {
            return false;
        }

        const location = event.getUILocation();
        const visibleSize = view.getVisibleSize();
        const x = location.x - visibleSize.width * 0.5;
        const y = location.y - visibleSize.height * 0.5;
        const promptPosition = this.promptRoot.position;
        const halfWidth = transform.contentSize.width * 0.5;
        const halfHeight = transform.contentSize.height * 0.5;

        return (
            x >= promptPosition.x - halfWidth
            && x <= promptPosition.x + halfWidth
            && y >= promptPosition.y - halfHeight
            && y <= promptPosition.y + halfHeight
        );
    }
}
