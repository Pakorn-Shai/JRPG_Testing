import { _decorator, Component, director, Node } from 'cc';
import { resetPlayerState, setCurrentScene } from '../data/GameState';

const { ccclass, property } = _decorator;

@ccclass('TitleMenuController')
export class TitleMenuController extends Component {
    @property
    public startScene = 'HomeScene';

    public onEnable(): void {
        this.node.on(Node.EventType.TOUCH_END, this.startGame, this);
        this.node.on(Node.EventType.MOUSE_UP, this.startGame, this);
    }

    public onDisable(): void {
        this.node.off(Node.EventType.TOUCH_END, this.startGame, this);
        this.node.off(Node.EventType.MOUSE_UP, this.startGame, this);
    }

    private startGame(): void {
        resetPlayerState();
        setCurrentScene(this.startScene);
        director.loadScene(this.startScene);
    }
}

