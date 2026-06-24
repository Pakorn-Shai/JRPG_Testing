import { _decorator, Collider2D, Component, Contact2DType, IPhysics2DContact, Label, Node, UITransform } from 'cc';
import { PlayerController } from '../controllers/PlayerController';
import { damagePlayer, playerState } from '../data/GameState';
import { FOREST_MONSTER } from '../data/MonsterData';

const { ccclass, property } = _decorator;

@ccclass('BattleTrigger')
export class BattleTrigger extends Component {
    @property
    public monsterName = FOREST_MONSTER.name;

    @property
    public monsterHp = FOREST_MONSTER.hp;

    @property
    public monsterAtk = FOREST_MONSTER.atk;

    @property(Node)
    public battleRoot: Node | null = null;

    @property(Label)
    public battleLabel: Label | null = null;

    @property(Label)
    public playerHpLabel: Label | null = null;

    @property(Label)
    public monsterHpLabel: Label | null = null;

    @property(Node)
    public playerHpFill: Node | null = null;

    @property(Node)
    public monsterHpFill: Node | null = null;

    @property(Node)
    public actionRoot: Node | null = null;

    private collider: Collider2D | null = null;
    private isBattling = false;
    private currentMonsterHp = 0;
    private playerController: PlayerController | null = null;
    private isPlayerTurn = true;
    private readonly playerHpBarWidth = 320;
    private readonly monsterHpBarWidth = 320;

    public onLoad(): void {
        this.collider = this.getComponent(Collider2D);
        this.currentMonsterHp = this.monsterHp;
        if (this.battleRoot) {
            this.battleRoot.active = false;
        }
        this.bindActionButtons();
        this.refreshHud();
    }

    public onEnable(): void {
        this.collider?.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    public onDisable(): void {
        this.collider?.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        this.unschedule(this.monsterTurn);
    }

    private onBeginContact(_self: Collider2D, other: Collider2D, _contact: IPhysics2DContact | null): void {
        if (this.isBattling || !other.getComponent(PlayerController)) {
            return;
        }

        this.playerController = other.getComponent(PlayerController);
        if (this.playerController) {
            this.playerController.enabled = false;
        }

        this.isBattling = true;
        this.isPlayerTurn = true;
        this.currentMonsterHp = this.monsterHp;
        this.bindActionButtons();
        if (this.battleRoot) {
            this.battleRoot.setSiblingIndex(999);
            this.battleRoot.active = true;
        }
        this.setButtonsEnabled(true);
        this.writeLog(`พบ ${this.monsterName}! เลือกท่าโจมตี`);
        this.refreshHud();
    }

    public useAttack(multiplier = 1, skillName = 'Attack'): void {
        if (!this.isBattling || !this.isPlayerTurn) {
            return;
        }

        this.isPlayerTurn = false;
        this.setButtonsEnabled(false);

        const damage = Math.max(1, Math.round(playerState.atk * multiplier));
        this.currentMonsterHp = Math.max(0, this.currentMonsterHp - damage);
        this.writeLog(`${playerState.name} ใช้ ${skillName}! ${this.monsterName} เสีย ${damage} HP`);
        this.refreshHud();

        if (this.currentMonsterHp <= 0) {
            this.writeLog(`${this.monsterName} หมดสติแล้ว!`);
            this.finishBattle();
            return;
        }

        this.scheduleOnce(this.monsterTurn, 0.85);
    }

    private monsterTurn = (): void => {
        const remainingHp = damagePlayer(this.monsterAtk);
        this.writeLog(
            `${this.monsterName} โต้กลับ! ${playerState.name} เหลือ ${remainingHp}/${playerState.maxHp} HP`,
        );
        this.refreshHud();

        if (remainingHp <= 0) {
            this.writeLog(`${playerState.name} หมดสติ...`);
            this.finishBattle(false);
            return;
        }

        this.isPlayerTurn = true;
        this.setButtonsEnabled(true);
    };

    private finishBattle(victory = true): void {
        this.unschedule(this.monsterTurn);
        this.isBattling = false;
        this.setButtonsEnabled(false);

        if (this.playerController) {
            this.playerController.enabled = true;
            this.playerController = null;
        }

        if (victory && this.currentMonsterHp <= 0) {
            this.node.active = false;
            this.scheduleOnce(() => {
                if (this.battleRoot) {
                    this.battleRoot.active = false;
                }
            }, 1.2);
        }
    }

    private bindActionButtons(): void {
        if (!this.actionRoot) {
            return;
        }

        const skills = [
            { name: 'Attack', multiplier: 1 },
            { name: 'Power Hit', multiplier: 1.35 },
            { name: 'Quick Slash', multiplier: 0.8 },
            { name: 'Guard Break', multiplier: 1.15 },
        ];

        this.actionRoot.children.forEach((button, index) => {
            const skill = skills[index] ?? skills[0];
            button.off(Node.EventType.TOUCH_END, undefined, this);
            button.off(Node.EventType.MOUSE_UP, undefined, this);
            button.on(Node.EventType.TOUCH_END, () => this.useAttack(skill.multiplier, skill.name), this);
            button.on(Node.EventType.MOUSE_UP, () => this.useAttack(skill.multiplier, skill.name), this);
        });
    }

    private refreshHud(): void {
        if (this.playerHpLabel) {
            this.playerHpLabel.string = `${playerState.name} HP ${playerState.hp}/${playerState.maxHp}`;
        }
        if (this.monsterHpLabel) {
            this.monsterHpLabel.string = `${this.monsterName} HP ${this.currentMonsterHp}/${this.monsterHp}`;
        }
        this.setBarWidth(this.playerHpFill, this.playerHpBarWidth, playerState.hp / playerState.maxHp);
        this.setBarWidth(this.monsterHpFill, this.monsterHpBarWidth, this.currentMonsterHp / this.monsterHp);
    }

    private setBarWidth(node: Node | null, maxWidth: number, ratio: number): void {
        const transform = node?.getComponent(UITransform);
        if (!node || !transform) {
            return;
        }

        const safeRatio = Math.max(0, Math.min(1, ratio));
        const width = safeRatio * maxWidth;
        node.setScale(Math.max(0.001, safeRatio), node.scale.y, node.scale.z);
        node.setPosition(-maxWidth * 0.5 + width * 0.5, node.position.y, node.position.z);
    }

    private setButtonsEnabled(enabled: boolean): void {
        if (!this.actionRoot) {
            return;
        }

        for (const child of this.actionRoot.children) {
            child.active = true;
            if (enabled) {
                child.resumeSystemEvents(true);
            } else {
                child.pauseSystemEvents(true);
            }
        }
    }

    private writeLog(text: string): void {
        if (this.battleLabel) {
            this.battleLabel.string = text;
        }
    }
}
