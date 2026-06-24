import {
    _decorator,
    Component,
    EventKeyboard,
    EventTouch,
    Input,
    input,
    KeyCode,
    Node,
    RigidBody2D,
    Sprite,
    SpriteFrame,
    Vec2,
    Vec3,
    view,
} from 'cc';
import { playerState } from '../data/GameState';

const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {
    @property
    public allowTouchInput = true;

    @property
    public allowKeyboardInput = true;

    @property
    public allowVerticalMovement = false;

    @property
    public useMovementBounds = false;

    @property
    public minX = -540;

    @property
    public maxX = 540;

    @property
    public minY = -260;

    @property
    public maxY = 40;

    @property([SpriteFrame])
    public walkFrames: SpriteFrame[] = [];

    @property(SpriteFrame)
    public idleFrame: SpriteFrame | null = null;

    @property
    public animationFps = 8;

    @property
    public animateWalkFrames = false;

    @property
    public acceleration = 18;

    private readonly pressedKeys = new Set<KeyCode>();
    private readonly fallbackMove = new Vec3();
    private readonly velocity = new Vec2();
    private touchVector = new Vec2();
    private body: RigidBody2D | null = null;
    private sprite: Sprite | null = null;
    private visual: Node | null = null;
    private isTouching = false;
    private lockedY = 0;
    private facing = 1;
    private walkTime = 0;
    private visualBaseY = 0;

    public onLoad(): void {
        this.body = this.getComponent(RigidBody2D);
        this.visual = this.node.getChildByName('PlayerVisual') ?? this.node;
        this.sprite = this.visual.getComponent(Sprite);
        this.idleFrame = this.idleFrame ?? this.sprite?.spriteFrame ?? null;
        this.lockedY = this.node.position.y;
        this.visualBaseY = this.visual.position.y;
    }

    public onEnable(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    public onDisable(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.stopMotion();
    }

    public update(deltaTime: number): void {
        const move = this.resolveMoveVector();
        const speed = playerState.speed;
        const targetX = move.x * speed;
        const targetY = this.allowVerticalMovement ? move.y * speed : 0;
        const smoothing = Math.min(1, this.acceleration * deltaTime);
        this.velocity.set(
            this.velocity.x + (targetX - this.velocity.x) * smoothing,
            this.velocity.y + (targetY - this.velocity.y) * smoothing,
        );
        this.constrainVelocityAtBounds();

        if (this.body) {
            this.body.linearVelocity = this.velocity;
            if (!this.allowVerticalMovement) {
                const pos = this.node.position;
                this.node.setPosition(pos.x, this.lockedY, pos.z);
            }
            this.clampToMovementBounds();
            this.updateVisual(deltaTime, move.lengthSqr() > 0.01);
            return;
        }

        this.fallbackMove.set(
            this.velocity.x * deltaTime,
            this.velocity.y * deltaTime,
            0,
        );
        this.node.translate(this.fallbackMove);
        if (!this.allowVerticalMovement) {
            const pos = this.node.position;
            this.node.setPosition(pos.x, this.lockedY, pos.z);
        }
        this.clampToMovementBounds();
        this.updateVisual(deltaTime, move.lengthSqr() > 0.01);
    }

    public lateUpdate(): void {
        this.clampToMovementBounds();
        this.constrainVelocityAtBounds();
        if (this.body) {
            this.body.linearVelocity = this.velocity;
        }
    }

    private resolveMoveVector(): Vec2 {
        let x = 0;
        let y = 0;

        if (this.allowKeyboardInput) {
            x += Number(this.pressedKeys.has(KeyCode.ARROW_RIGHT) || this.pressedKeys.has(KeyCode.KEY_D));
            x -= Number(this.pressedKeys.has(KeyCode.ARROW_LEFT) || this.pressedKeys.has(KeyCode.KEY_A));
            if (this.allowVerticalMovement) {
                y += Number(this.pressedKeys.has(KeyCode.ARROW_UP) || this.pressedKeys.has(KeyCode.KEY_W));
                y -= Number(this.pressedKeys.has(KeyCode.ARROW_DOWN) || this.pressedKeys.has(KeyCode.KEY_S));
            }
        }

        if (this.allowTouchInput && this.isTouching) {
            x += this.touchVector.x;
            if (this.allowVerticalMovement) {
                y += this.touchVector.y;
            }
        }

        const move = new Vec2(x, y);
        if (move.lengthSqr() > 1) {
            move.normalize();
        }

        if (Math.abs(move.x) > 0.01) {
            this.facing = -Math.sign(move.x);
        }

        return move;
    }

    private stopMotion(): void {
        this.pressedKeys.clear();
        this.touchVector.set(0, 0);
        this.isTouching = false;
        this.velocity.set(0, 0);
        if (this.body) {
            this.body.linearVelocity = Vec2.ZERO;
        }
    }

    private constrainVelocityAtBounds(): void {
        if (!this.useMovementBounds) {
            return;
        }

        const pos = this.node.position;
        if (pos.x <= this.minX && this.velocity.x < 0) {
            this.velocity.x = 0;
        } else if (pos.x >= this.maxX && this.velocity.x > 0) {
            this.velocity.x = 0;
        }

        if (this.allowVerticalMovement) {
            if (pos.y <= this.minY && this.velocity.y < 0) {
                this.velocity.y = 0;
            } else if (pos.y >= this.maxY && this.velocity.y > 0) {
                this.velocity.y = 0;
            }
        }
    }

    private clampToMovementBounds(): void {
        if (!this.useMovementBounds) {
            return;
        }

        const pos = this.node.position;
        const x = Math.min(this.maxX, Math.max(this.minX, pos.x));
        const y = this.allowVerticalMovement
            ? Math.min(this.maxY, Math.max(this.minY, pos.y))
            : this.lockedY;
        if (x !== pos.x || y !== pos.y) {
            this.node.setPosition(x, y, pos.z);
        }
    }

    private updateVisual(deltaTime: number, isMoving: boolean): void {
        if (!this.visual) {
            return;
        }

        const scale = this.visual.scale;
        this.visual.setScale(Math.abs(scale.x) * this.facing, scale.y, scale.z);

        if (!isMoving) {
            this.walkTime = 0;
            if (this.sprite && this.idleFrame) {
                this.sprite.spriteFrame = this.idleFrame;
            }
            this.visual.setPosition(0, this.visualBaseY, 0);
            return;
        }

        this.walkTime += deltaTime;
        if (this.animateWalkFrames && this.sprite && this.walkFrames.length > 0) {
            const index = Math.floor(this.walkTime * this.animationFps) % this.walkFrames.length;
            this.sprite.spriteFrame = this.walkFrames[index];
        } else if (this.sprite && this.idleFrame) {
            this.sprite.spriteFrame = this.idleFrame;
        }

        const bob = Math.sin(this.walkTime * Math.PI * this.animationFps) * 3;
        this.visual.setPosition(0, this.visualBaseY + bob, 0);
    }

    private onKeyDown(event: EventKeyboard): void {
        this.pressedKeys.add(event.keyCode);
    }

    private onKeyUp(event: EventKeyboard): void {
        this.pressedKeys.delete(event.keyCode);
    }

    private onTouchStart(event: EventTouch): void {
        this.isTouching = true;
        this.updateTouchVector(event);
    }

    private onTouchMove(event: EventTouch): void {
        this.updateTouchVector(event);
    }

    private onTouchEnd(): void {
        this.isTouching = false;
        this.touchVector.set(0, 0);
    }

    private updateTouchVector(event: EventTouch): void {
        const location = event.getUILocation();
        const visibleSize = view.getVisibleSize();
        const centerX = visibleSize.width * 0.5;
        const centerY = visibleSize.height * 0.5;
        const dx = location.x - centerX;
        const dy = location.y - centerY;

        if (Math.abs(dx) < 24 && Math.abs(dy) < 24) {
            this.touchVector.set(0, 0);
            return;
        }

        this.touchVector.set(dx, dy).normalize();
    }
}
