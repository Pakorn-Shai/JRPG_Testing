export interface MonsterData {
    id: string;
    name: string;
    hp: number;
    atk: number;
    spriteFrameName: string;
}

export const FOREST_MONSTER: MonsterData = {
    id: 'm_001',
    name: 'Slime',
    hp: 40,
    atk: 8,
    spriteFrameName: 'monster_slime',
};

