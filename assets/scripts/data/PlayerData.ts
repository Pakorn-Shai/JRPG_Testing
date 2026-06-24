export interface PlayerData {
    name: string;
    hp: number;
    maxHp: number;
    atk: number;
    speed: number;
    currentScene: string;
}

export const INITIAL_PLAYER_DATA: PlayerData = {
    name: 'Hero',
    hp: 100,
    maxHp: 100,
    atk: 15,
    speed: 135,
    currentScene: 'HomeScene',
};
