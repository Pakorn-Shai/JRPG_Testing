import { _decorator, Collider2D, Component, Contact2DType, director, IPhysics2DContact } from 'cc';
import { PlayerController } from '../controllers/PlayerController';
import { setCurrentScene } from '../data/GameState';

const { ccclass, property } = _decorator;

@ccclass('SceneTrigger')
export class SceneTrigger extends Component {
    @property
    public targetScene = '';

    private collider: Collider2D | null = null;
    private isLoading = false;

    public onLoad(): void {
        this.collider = this.getComponent(Collider2D);
    }

    public onEnable(): void {
        this.collider?.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    public onDisable(): void {
        this.collider?.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    private onBeginContact(_self: Collider2D, other: Collider2D, _contact: IPhysics2DContact | null): void {
        if (this.isLoading || !this.targetScene || !other.getComponent(PlayerController)) {
            return;
        }

        this.isLoading = true;
        setCurrentScene(this.targetScene);
        director.loadScene(this.targetScene);
    }
}

