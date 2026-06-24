import { _decorator, Component, Node, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('CameraFollow')
export class CameraFollow extends Component {
    @property(Node)
    public target: Node | null = null;

    @property
    public minX = -320;

    @property
    public maxX = 320;

    @property
    public smooth = 8;

    private readonly nextPosition = new Vec3();

    public update(deltaTime: number): void {
        if (!this.target) {
            return;
        }

        const current = this.node.position;
        const targetX = Math.min(this.maxX, Math.max(this.minX, this.target.position.x));
        const t = Math.min(1, this.smooth * deltaTime);
        this.nextPosition.set(
            current.x + (targetX - current.x) * t,
            current.y,
            current.z,
        );
        this.node.setPosition(this.nextPosition);
    }
}

