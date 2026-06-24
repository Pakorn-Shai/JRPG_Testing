import {
    _decorator,
    BoxCollider2D,
    Canvas,
    Color,
    Component,
    ERigidBody2DType,
    GraphicsComponent,
    Label,
    Layers,
    Node,
    RigidBody2D,
    resources,
    Size,
    Sprite,
    SpriteFrame,
    UITransform,
    Vec2,
    Vec3,
} from 'cc';
import { PlayerController } from './PlayerController';
import { TitleMenuController } from './TitleMenuController';
import { SceneTrigger } from '../triggers/SceneTrigger';
import { DialogueTrigger } from '../triggers/DialogueTrigger';
import { BattleTrigger } from '../triggers/BattleTrigger';

const { ccclass, property } = _decorator;

type SceneKind = 'TitleScene' | 'HomeScene' | 'VillageScene' | 'ForestScene';

@ccclass('SceneBootstrap')
export class SceneBootstrap extends Component {
    @property
    public sceneKind: SceneKind = 'TitleScene';

    @property(SpriteFrame)
    public bgTitle: SpriteFrame | null = null;

    @property(SpriteFrame)
    public bgHome: SpriteFrame | null = null;

    @property(SpriteFrame)
    public bgVillage: SpriteFrame | null = null;

    @property(SpriteFrame)
    public bgForest: SpriteFrame | null = null;

    @property(SpriteFrame)
    public playerIdle: SpriteFrame | null = null;

    @property([SpriteFrame])
    public playerWalkFrames: SpriteFrame[] = [];

    @property(SpriteFrame)
    public npcChief: SpriteFrame | null = null;

    @property(SpriteFrame)
    public monsterSlime: SpriteFrame | null = null;

    @property(SpriteFrame)
    public dialogueBox: SpriteFrame | null = null;

    private ySortRoot: Node | null = null;
    private readonly homeFrames = new Map<string, SpriteFrame>();

    public start(): void {
        const canvas = this.ensureCanvas();
        if (canvas.getChildByName('__GeneratedSceneRoot')) {
            return;
        }

        const root = this.createNode('__GeneratedSceneRoot', canvas, 0, 0);

        if (this.sceneKind === 'TitleScene') {
            this.buildTitle(root);
        } else if (this.sceneKind === 'HomeScene') {
            this.loadHomeAssets(root);
        } else if (this.sceneKind === 'VillageScene') {
            this.buildVillage(root);
        } else {
            this.buildForest(root);
        }
    }

    private buildTitle(root: Node): void {
        this.createSprite('Background', root, this.bgTitle, 0, 0, 1280, 720);
        const titleNode = this.createNode('GameTitle', root, 0, 148);
        titleNode.addComponent(UITransform).setContentSize(900, 100);
        const title = titleNode.addComponent(Label);
        title.string = 'ตำนานป่าต้องห้าม';
        title.fontSize = 64;
        title.lineHeight = 78;
        title.color = new Color(255, 238, 184, 255);

        const subtitleNode = this.createNode('Subtitle', root, 0, 78);
        subtitleNode.addComponent(UITransform).setContentSize(900, 60);
        const subtitle = subtitleNode.addComponent(Label);
        subtitle.string = 'Simple RPG Starter';
        subtitle.fontSize = 28;
        subtitle.lineHeight = 36;
        subtitle.color = new Color(226, 232, 242, 255);

        const startButton = this.createNode('StartButton', root, 0, -210);
        startButton.addComponent(UITransform).setContentSize(420, 92);
        this.createSprite('StartButtonFrame', startButton, this.dialogueBox, 0, 0, 420, 92);
        const startLabelNode = this.createNode('StartButtonText', startButton, 0, 2);
        startLabelNode.addComponent(UITransform).setContentSize(360, 64);
        const startLabel = startLabelNode.addComponent(Label);
        startLabel.string = 'เริ่มเกม';
        startLabel.fontSize = 36;
        startLabel.lineHeight = 48;
        startLabel.color = new Color(255, 244, 210, 255);
        startButton.addComponent(TitleMenuController).startScene = 'HomeScene';
    }

    public lateUpdate(): void {
        if (!this.ySortRoot) {
            return;
        }

        const sorted = [...this.ySortRoot.children].sort((a, b) => b.position.y - a.position.y);
        sorted.forEach((child, index) => child.setSiblingIndex(index));
    }

    private loadHomeAssets(root: Node): void {
        resources.loadDir('home', SpriteFrame, (error, frames) => {
            if (error) {
                console.error('[HomeScene] Unable to load tilemap sprites.', error);
                this.createSprite('BackgroundFallback', root, this.bgHome, 0, 0, 1280, 720);
                this.createPlayer(root, -360, -190, -530, 530);
                return;
            }

            frames.forEach((frame) => this.homeFrames.set(frame.name, frame));
            this.buildHome(root);
        });
    }

    private buildHome(root: Node): void {
        const ground = this.createNode('Home_GroundTiles', root, 0, 0);
        const architecture = this.createNode('Home_Architecture', root, 0, 0);
        const world = this.createNode('Home_YSortedWorld', root, 0, 0);
        const foreground = this.createNode('Home_Foreground', root, 0, 0);
        this.ySortRoot = world;

        this.createHomeFloor(ground);
        this.createHomeArchitecture(architecture, foreground);
        this.createHomeRugs(ground);
        this.createHomeFurniture(world);

        this.createPlayer(world, -330, -150, -548, 548, -300, 116, true);
        this.createSolidCollider('HomeLeftWall', world, -620, -60, 46, 560);
        this.createSolidCollider('HomeRightWall', world, 620, -60, 46, 560);
        this.createSolidCollider('HomeBackWallLeft', world, -380, 146, 460, 44);
        this.createSolidCollider('HomeBackWallRight', world, 330, 146, 570, 44);
        this.createSolidCollider('HomeFrontWall', world, 0, -332, 1280, 44);
        this.createSceneTrigger('DoorTrigger', world, -54, 170, 130, 90, 'VillageScene');
    }

    private buildVillage(root: Node): void {
        this.createSprite('Background', root, this.bgVillage, 0, 0, 1920, 720);
        this.createPlayer(root, 250, -190, -530, 530);

        const chief = this.createSprite('VillageChief', root, this.npcChief, 0, -132, 320, 320);
        const prompt = this.createInteractionPrompt('ChiefDialoguePrompt', root, chief.position.x, chief.position.y + 190);
        const dialogue = this.createDialogue(root);
        const trigger = this.createTriggerNode('ChiefDialogueTrigger', root, chief.position.x, chief.position.y, 300, 300);
        const dialogueTrigger = trigger.addComponent(DialogueTrigger);
        dialogueTrigger.dialogueRoot = dialogue.root;
        dialogueTrigger.messageLabel = dialogue.label;
        dialogueTrigger.promptRoot = prompt;
        dialogueTrigger.interactTarget = chief;
        dialogueTrigger.refreshInteractEvents();

        this.createSolidCollider('VillageRightWall', root, 640, -190, 70, 420);
        this.createSolidCollider('VillageBackWall', root, 0, 28, 1920, 70);
        this.createSceneTrigger('LeftForestTrigger', root, -590, -90, 120, 400, 'ForestScene');
    }

    private buildForest(root: Node): void {
        this.createSprite('Background', root, this.bgForest, 0, 0, 1280, 720);
        this.createPlayer(root, -360, -190, -530, 530);
        this.createSolidCollider('ForestLeftWall', root, -640, -190, 70, 420);
        this.createSolidCollider('ForestRightWall', root, 640, -190, 70, 420);
        this.createSolidCollider('ForestBackWall', root, 0, 24, 1280, 70);
        const battleUi = this.createBattleScreen(root);
        const monster = this.createSprite('Slime', root, this.monsterSlime, 260, -154, 280, 280);
        this.createSolidCollider('SlimeBlocker', root, 260, -204, 170, 105);
        const collider = this.addBoxCollider(monster, 220, 220, true, ERigidBody2DType.Static);
        const battleTrigger = collider.node.addComponent(BattleTrigger);
        battleTrigger.battleRoot = battleUi.root;
        battleTrigger.battleLabel = battleUi.logLabel;
        battleTrigger.playerHpLabel = battleUi.playerHpLabel;
        battleTrigger.monsterHpLabel = battleUi.monsterHpLabel;
        battleTrigger.playerHpFill = battleUi.playerHpFill;
        battleTrigger.monsterHpFill = battleUi.monsterHpFill;
        battleTrigger.actionRoot = battleUi.actionRoot;
    }

    private ensureCanvas(): Node {
        const sceneRoot = this.node.parent ?? this.node;
        const existing = sceneRoot.getChildByName('Canvas') ?? this.node.getChildByName('Canvas');
        if (existing) {
            return existing;
        }

        const canvasNode = this.createNode('Canvas', sceneRoot, 0, 0);
        canvasNode.addComponent(Canvas);
        canvasNode.addComponent(UITransform).setContentSize(1280, 720);
        return canvasNode;
    }

    private createPlayer(
        parent: Node,
        x: number,
        y: number,
        minX: number,
        maxX: number,
        minY = y - 20,
        maxY = y + 20,
        allowVerticalMovement = false,
    ): Node {
        const player = this.createNode('Player', parent, x, y);
        player.addComponent(UITransform).setContentSize(40, 30);
        this.createEllipse('PlayerShadow', player, 0, 8, 48, 20, new Color(22, 16, 18, 92));
        this.createSprite('PlayerVisual', player, this.playerIdle, 0, 54, 112, 112);
        const body = player.addComponent(RigidBody2D);
        body.type = ERigidBody2DType.Dynamic;
        body.gravityScale = 0;
        body.fixedRotation = true;
        body.enabledContactListener = true;
        const collider = this.addBoxCollider(player, 36, 24, false, ERigidBody2DType.Dynamic);
        collider.offset = new Vec2(0, 10);
        const controller = player.addComponent(PlayerController);
        controller.idleFrame = this.playerIdle;
        controller.walkFrames = this.playerWalkFrames;
        controller.animateWalkFrames = true;
        controller.allowVerticalMovement = allowVerticalMovement;
        controller.useMovementBounds = true;
        controller.minX = minX;
        controller.maxX = maxX;
        controller.minY = minY;
        controller.maxY = maxY;
        return player;
    }

    private createHomeFloor(parent: Node): void {
        const tileSize = 128;
        const columns = 10;
        const rows = 4;
        const frames = [
            this.homeFrame('floor_stone_a'),
            this.homeFrame('floor_stone_b'),
        ];

        for (let row = 0; row < rows; row++) {
            for (let column = 0; column < columns; column++) {
                const x = -576 + column * tileSize;
                const y = -270 + row * tileSize;
                const frame = frames[(column + row * 3) % frames.length];
                this.createSprite(`GroundTile_${column}_${row}`, parent, frame, x, y, tileSize + 2, tileSize + 2);
            }
        }

        this.createPanel('FloorWarmth', parent, 0, -78, 1280, 512, new Color(91, 48, 23, 28), undefined, 0);
    }

    private createHomeArchitecture(back: Node, foreground: Node): void {
        const wallFrame = this.homeFrame('wall_plaster');
        for (let column = 0; column < 10; column++) {
            this.createSprite(`WallTile_${column}`, back, wallFrame, -576 + column * 128, 282, 130, 180);
        }

        this.createSprite('BackWallBeam', foreground, this.homeFrame('beam_horizontal'), 0, 183, 1280, 50);
        this.createSprite('CeilingBeam', foreground, this.homeFrame('beam_horizontal'), 0, 350, 1280, 62);
        [-570, -310, 0, 310, 570].forEach((x, index) => {
            this.createSprite(`WallPost_${index}`, foreground, this.homeFrame('beam_vertical'), x, 275, 48, 190);
        });

        this.createSprite('WindowLeft', back, this.homeFrame('window'), -355, 275, 190, 174);
        this.createSprite('WindowRight', back, this.homeFrame('window'), 340, 275, 190, 174);
        this.createSprite('HouseDoor', back, this.homeFrame('door'), -54, 260, 144, 208);
        this.createSprite('WallBooks', back, this.homeFrame('bookshelf'), 550, 266, 126, 152);
    }

    private createHomeRugs(parent: Node): void {
        this.createSprite('RugRed', parent, this.homeFrame('rug_red'), -325, -154, 390, 238);
        this.createSprite('RugTeal', parent, this.homeFrame('rug_teal'), 346, -135, 390, 238);
    }

    private createHomeFurniture(parent: Node): void {
        this.createWorldSprite('Bed', parent, this.homeFrame('bed'), -488, -2, 218, 224);
        this.createWorldSprite('DiningTable', parent, this.homeFrame('table'), -250, -115, 312, 209);
        this.createWorldSprite('PotionCabinet', parent, this.homeFrame('potion_cabinet'), 178, 66, 150, 142);
        this.createWorldSprite('KitchenCounter', parent, this.homeFrame('kitchen'), 468, 60, 274, 264);
        this.createWorldSprite('Fireplace', parent, this.homeFrame('fireplace'), 438, -196, 210, 254);
        this.createWorldSprite('IndoorPlant', parent, this.homeFrame('plant'), 38, 72, 108, 98);
        this.createWorldSprite('Firewood', parent, this.homeFrame('firewood'), 292, -18, 124, 101);

        this.createSolidCollider('BedCollider', parent, -488, -14, 196, 88);
        this.createSolidCollider('TableCollider', parent, -250, -126, 250, 72);
        this.createSolidCollider('ShelfCollider', parent, 178, 56, 118, 58);
        this.createSolidCollider('KitchenCollider', parent, 468, 48, 246, 66);
        this.createSolidCollider('FireplaceCollider', parent, 438, -208, 178, 82);
        this.createSolidCollider('FirewoodCollider', parent, 292, -30, 102, 48);
    }

    private homeFrame(name: string): SpriteFrame | null {
        return this.homeFrames.get(name) ?? null;
    }

    private createWorldSprite(
        name: string,
        parent: Node,
        frame: SpriteFrame | null,
        x: number,
        baselineY: number,
        width: number,
        height: number,
    ): Node {
        const root = this.createNode(name, parent, x, baselineY);
        this.createEllipse(`${name}Shadow`, root, 0, 8, width * 0.72, Math.max(18, height * 0.14), new Color(20, 12, 9, 65));
        this.createSprite(`${name}Visual`, root, frame, 0, height * 0.5, width, height);
        return root;
    }

    private createWindow(parent: Node, x: number, y: number): void {
        const frame = this.createPanel(`Window_${x}`, parent, x, y, 148, 112, new Color(84, 49, 33, 255), new Color(67, 38, 26, 255), 4);
        const glass = frame.getComponent(GraphicsComponent)!;
        glass.fillColor = new Color(132, 205, 220, 255);
        glass.rect(-60, -42, 120, 84);
        glass.fill();
        glass.strokeColor = new Color(239, 221, 170, 230);
        glass.lineWidth = 5;
        glass.moveTo(0, -42);
        glass.lineTo(0, 42);
        glass.moveTo(-60, 0);
        glass.lineTo(60, 0);
        glass.stroke();
    }

    private createDoor(parent: Node, x: number, y: number): void {
        const door = this.createPanel('HouseDoor', parent, x, y, 126, 168, new Color(99, 58, 38, 255), new Color(57, 34, 25, 255), 12);
        const graphics = door.getComponent(GraphicsComponent)!;
        graphics.strokeColor = new Color(171, 113, 61, 255);
        graphics.lineWidth = 5;
        graphics.roundRect(-48, -70, 96, 140, 8);
        graphics.stroke();
        graphics.fillColor = new Color(226, 179, 83, 255);
        graphics.circle(34, -2, 6);
        graphics.fill();
    }

    private createRug(parent: Node, x: number, y: number, width: number, height: number, fill: Color, border: Color): void {
        const rug = this.createPanel(`Rug_${x}`, parent, x, y, width, height, fill, border, 14);
        const graphics = rug.getComponent(GraphicsComponent)!;
        graphics.strokeColor = new Color(border.r, border.g, border.b, 170);
        graphics.lineWidth = 3;
        graphics.roundRect(-width * 0.42, -height * 0.34, width * 0.84, height * 0.68, 10);
        graphics.stroke();
        graphics.moveTo(-width * 0.28, 0);
        graphics.lineTo(0, height * 0.22);
        graphics.lineTo(width * 0.28, 0);
        graphics.lineTo(0, -height * 0.22);
        graphics.close();
        graphics.stroke();
    }

    private createBed(parent: Node, x: number, y: number): void {
        const bed = this.createNode('Bed', parent, x, y);
        this.createPanel('BedFrame', bed, 0, 0, 250, 144, new Color(91, 51, 33, 255), new Color(53, 31, 24, 255), 12);
        this.createPanel('Mattress', bed, 8, 12, 210, 106, new Color(225, 211, 178, 255), undefined, 14);
        this.createPanel('Blanket', bed, -2, -15, 212, 62, new Color(55, 91, 132, 255), new Color(214, 169, 84, 255), 8);
        this.createPanel('Pillow', bed, -58, 45, 72, 34, new Color(244, 230, 199, 255), undefined, 12);
    }

    private createTable(parent: Node, x: number, y: number): void {
        const table = this.createNode('DiningTable', parent, x, y);
        this.createPanel('TableShadow', table, 0, -8, 286, 92, new Color(33, 22, 18, 58), undefined, 20);
        this.createPanel('TableTop', table, 0, 20, 282, 82, new Color(119, 70, 42, 255), new Color(67, 39, 28, 255), 12);
        this.createPanel('Runner', table, 0, 23, 76, 78, new Color(176, 129, 67, 255), undefined, 3);
        this.createPanel('TableLegLeft', table, -105, -38, 24, 78, new Color(75, 43, 30, 255));
        this.createPanel('TableLegRight', table, 105, -38, 24, 78, new Color(75, 43, 30, 255));
        this.createEllipse('PlateLeft', table, -70, 24, 40, 19, new Color(222, 210, 176, 255));
        this.createEllipse('PlateRight', table, 70, 24, 40, 19, new Color(222, 210, 176, 255));
    }

    private createShelf(parent: Node, x: number, y: number): void {
        const shelf = this.createNode('PotionShelf', parent, x, y);
        this.createPanel('ShelfBody', shelf, 0, 42, 154, 166, new Color(104, 61, 39, 255), new Color(58, 34, 25, 255), 8);
        this.createPanel('ShelfOpeningTop', shelf, 0, 72, 120, 45, new Color(50, 35, 29, 255), undefined, 3);
        this.createPanel('ShelfOpeningBottom', shelf, 0, 17, 120, 45, new Color(50, 35, 29, 255), undefined, 3);
        const colors = [
            new Color(87, 155, 151, 255),
            new Color(176, 88, 67, 255),
            new Color(198, 158, 71, 255),
        ];
        [-38, 0, 38].forEach((offset, index) => {
            this.createPanel(`Bottle_${index}`, shelf, offset, 70, 18, 29, colors[index], undefined, 7);
        });
    }

    private createKitchen(parent: Node, x: number, y: number): void {
        const kitchen = this.createNode('KitchenCounter', parent, x, y);
        this.createPanel('CounterBase', kitchen, 0, 26, 224, 116, new Color(125, 73, 44, 255), new Color(65, 38, 28, 255), 6);
        this.createPanel('CounterTop', kitchen, 0, 88, 240, 24, new Color(87, 91, 82, 255), new Color(43, 45, 42, 255), 5);
        this.createPanel('CupboardLeft', kitchen, -54, 24, 82, 72, new Color(102, 58, 38, 255), new Color(172, 112, 60, 255), 5);
        this.createPanel('CupboardRight', kitchen, 54, 24, 82, 72, new Color(102, 58, 38, 255), new Color(172, 112, 60, 255), 5);
        this.createEllipse('Pan', kitchen, 48, 102, 58, 20, new Color(48, 52, 53, 255));
    }

    private createFireplace(parent: Node, x: number, y: number): void {
        const fireplace = this.createNode('Fireplace', parent, x, y);
        this.createPanel('BrickBody', fireplace, 0, 30, 194, 156, new Color(139, 73, 52, 255), new Color(73, 42, 34, 255), 10);
        this.createPanel('Hearth', fireplace, 0, -10, 142, 86, new Color(43, 31, 29, 255), new Color(92, 56, 39, 255), 32);
        this.createEllipse('FireGlow', fireplace, 0, -4, 94, 62, new Color(243, 125, 38, 110));
        const flame = this.createNode('Flame', fireplace, 0, 0);
        const graphics = flame.addComponent(GraphicsComponent);
        graphics.fillColor = new Color(255, 190, 50, 255);
        graphics.moveTo(-28, -22);
        graphics.bezierCurveTo(-34, 12, -4, 18, 0, 48);
        graphics.bezierCurveTo(12, 18, 38, 7, 27, -22);
        graphics.close();
        graphics.fill();
    }

    private createPlant(parent: Node, x: number, y: number): void {
        const plant = this.createNode('IndoorPlant', parent, x, y);
        this.createPanel('PlantPot', plant, 0, -3, 54, 52, new Color(143, 79, 48, 255), new Color(78, 45, 34, 255), 12);
        const leaves = [
            [-23, 35, -24],
            [0, 50, 0],
            [24, 35, 24],
            [-15, 68, -10],
            [17, 67, 12],
        ];
        leaves.forEach(([leafX, leafY, angle], index) => {
            const leaf = this.createEllipse(`Leaf_${index}`, plant, leafX, leafY, 42, 19, new Color(63 + index * 4, 128 + index * 5, 64, 255));
            leaf.setRotationFromEuler(0, 0, angle);
        });
    }

    private createEllipse(name: string, parent: Node, x: number, y: number, width: number, height: number, fill: Color): Node {
        const node = this.createNode(name, parent, x, y);
        node.addComponent(UITransform).setContentSize(width, height);
        const graphics = node.addComponent(GraphicsComponent);
        graphics.fillColor = fill;
        graphics.ellipse(0, 0, width * 0.5, height * 0.5);
        graphics.fill();
        return node;
    }

    private createSceneTrigger(name: string, parent: Node, x: number, y: number, width: number, height: number, targetScene: string): Node {
        const trigger = this.createTriggerNode(name, parent, x, y, width, height);
        trigger.addComponent(SceneTrigger).targetScene = targetScene;
        return trigger;
    }

    private createTriggerNode(name: string, parent: Node, x: number, y: number, width: number, height: number): Node {
        const trigger = this.createNode(name, parent, x, y);
        this.addBoxCollider(trigger, width, height, true, ERigidBody2DType.Static);
        return trigger;
    }

    private createSolidCollider(name: string, parent: Node, x: number, y: number, width: number, height: number): Node {
        const wall = this.createNode(name, parent, x, y);
        this.addBoxCollider(wall, width, height, false, ERigidBody2DType.Static);
        return wall;
    }

    private addBoxCollider(node: Node, width: number, height: number, sensor: boolean, bodyType: ERigidBody2DType): BoxCollider2D {
        let body = node.getComponent(RigidBody2D);
        if (!body) {
            body = node.addComponent(RigidBody2D);
        }
        body.type = bodyType;
        body.gravityScale = 0;
        body.enabledContactListener = true;

        const collider = node.addComponent(BoxCollider2D);
        collider.size = new Size(width, height);
        collider.sensor = sensor;
        return collider;
    }

    private createDialogue(parent: Node): { root: Node; label: Label } {
        const root = this.createNode('DialoguePanel', parent, 0, -240);
        root.active = false;
        this.createSprite('DialogueBox', root, this.dialogueBox, 0, 0, 1000, 200);
        const labelNode = this.createNode('DialogueText', root, 0, 6);
        labelNode.addComponent(UITransform).setContentSize(900, 140);
        const label = labelNode.addComponent(Label);
        label.string = '';
        label.fontSize = 28;
        label.lineHeight = 36;
        label.color = new Color(255, 244, 210, 255);
        return { root, label };
    }

    private createInteractionPrompt(name: string, parent: Node, x: number, y: number): Node {
        const prompt = this.createPanel(name, parent, x, y, 92, 60, new Color(8, 8, 12, 222), new Color(222, 178, 78, 255), 18);
        prompt.active = false;
        this.createLabel(`${name}Text`, prompt, '...', 0, 4, 72, 42, 34);
        return prompt;
    }

    private createBattlePanel(parent: Node): { root: Node; label: Label } {
        const root = this.createNode('BattlePanel', parent, 0, 246);
        root.active = false;
        this.createSprite('BattleBox', root, this.dialogueBox, 0, 0, 1000, 200);
        const labelNode = this.createNode('BattleText', root, 0, 8);
        labelNode.addComponent(UITransform).setContentSize(900, 140);
        const label = labelNode.addComponent(Label);
        label.string = '';
        label.fontSize = 26;
        label.lineHeight = 34;
        label.color = new Color(255, 244, 210, 255);
        return { root, label };
    }

    private createBattleScreen(parent: Node): {
        root: Node;
        logLabel: Label;
        playerHpLabel: Label;
        monsterHpLabel: Label;
        playerHpFill: Node;
        monsterHpFill: Node;
        actionRoot: Node;
    } {
        const root = this.createNode('BattleScreen', parent, 0, 0);
        root.active = false;

        this.createSprite('BattleBackdrop', root, this.bgForest, 0, 0, 1280, 720);
        this.createPanel('BattleTint', root, 0, 0, 1280, 720, new Color(0, 0, 0, 70));
        this.createSprite('BattlePlayer', root, this.playerIdle, -360, -42, 420, 420);
        this.createSprite('BattleMonster', root, this.monsterSlime, 330, -42, 360, 360);

        const playerPanel = this.createPanel('PlayerStatusPanel', root, -360, 250, 430, 92, new Color(10, 16, 18, 218), new Color(75, 218, 92, 255));
        const playerHpLabel = this.createLabel('PlayerHpLabel', playerPanel, 'Hero HP 100/100', 0, 20, 340, 36, 24);
        this.createPanel('PlayerHpBarBack', playerPanel, 0, -24, 336, 22, new Color(36, 38, 42, 255), new Color(10, 10, 10, 200), 8);
        const playerHpFill = this.createPanel('PlayerHpFill', playerPanel, 0, -24, 320, 14, new Color(75, 218, 92, 255), undefined, 7);

        const monsterPanel = this.createPanel('MonsterStatusPanel', root, 360, 250, 430, 92, new Color(18, 10, 14, 218), new Color(242, 82, 82, 255));
        const monsterHpLabel = this.createLabel('MonsterHpLabel', monsterPanel, 'Slime HP 40/40', 0, 20, 340, 36, 24);
        this.createPanel('MonsterHpBarBack', monsterPanel, 0, -24, 336, 22, new Color(36, 38, 42, 255), new Color(10, 10, 10, 200), 8);
        const monsterHpFill = this.createPanel('MonsterHpFill', monsterPanel, 0, -24, 320, 14, new Color(242, 82, 82, 255), undefined, 7);

        const logPanel = this.createPanel('BattleLogPanel', root, 0, -226, 900, 88, new Color(8, 8, 12, 222), new Color(222, 178, 78, 255));
        const logLabel = this.createLabel('BattleLogText', logPanel, '', 0, 2, 820, 62, 25);

        const actionRoot = this.createNode('BattleActions', root, 0, -322);
        const skills = ['Attack', 'Power Hit', 'Quick Slash', 'Guard Break'];
        const xs = [-315, -105, 105, 315];
        skills.forEach((skill, index) => {
            const fill = index % 2 === 0 ? new Color(89, 45, 118, 240) : new Color(130, 58, 87, 240);
            const button = this.createPanel(`Action_${skill.replace(' ', '')}`, actionRoot, xs[index], 0, 190, 58, fill, new Color(222, 178, 78, 255));
            this.createLabel(`${skill}Label`, button, skill, 0, 0, 160, 40, 20);
        });

        return {
            root,
            logLabel,
            playerHpLabel,
            monsterHpLabel,
            playerHpFill,
            monsterHpFill,
            actionRoot,
        };
    }

    private createLabel(name: string, parent: Node, text: string, x: number, y: number, width: number, height: number, fontSize: number): Label {
        const labelNode = this.createNode(name, parent, x, y);
        labelNode.addComponent(UITransform).setContentSize(width, height);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = Math.round(fontSize * 1.25);
        label.color = new Color(255, 244, 210, 255);
        return label;
    }

    private createPanel(
        name: string,
        parent: Node,
        x: number,
        y: number,
        width: number,
        height: number,
        fillColor: Color,
        borderColor?: Color,
        radius = 14,
    ): Node {
        const node = this.createNode(name, parent, x, y);
        node.addComponent(UITransform).setContentSize(width, height);
        const graphics = node.addComponent(GraphicsComponent);
        graphics.fillColor = fillColor;
        graphics.roundRect(-width * 0.5, -height * 0.5, width, height, radius);
        graphics.fill();

        if (borderColor) {
            graphics.strokeColor = borderColor;
            graphics.lineWidth = 3;
            graphics.roundRect(-width * 0.5, -height * 0.5, width, height, radius);
            graphics.stroke();
        }

        return node;
    }

    private createSprite(name: string, parent: Node, frame: SpriteFrame | null, x: number, y: number, width: number, height: number): Node {
        const node = this.createNode(name, parent, x, y);
        const transform = node.addComponent(UITransform);
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = frame;
        transform.setContentSize(width, height);
        return node;
    }

    private createNode(name: string, parent: Node, x: number, y: number): Node {
        const node = new Node(name);
        node.layer = Layers.Enum.UI_2D;
        node.setPosition(new Vec3(x, y, 0));
        parent.addChild(node);
        return node;
    }
}
