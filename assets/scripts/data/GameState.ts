import { INITIAL_PLAYER_DATA, PlayerData } from './PlayerData';

export const playerState: PlayerData = {
    ...INITIAL_PLAYER_DATA,
};

export function resetPlayerState(): void {
    Object.assign(playerState, INITIAL_PLAYER_DATA);
}

export function setCurrentScene(sceneName: string): void {
    playerState.currentScene = sceneName;
}

export function damagePlayer(amount: number): number {
    playerState.hp = Math.max(0, playerState.hp - amount);
    return playerState.hp;
}

export function healPlayer(amount: number): number {
    playerState.hp = Math.min(playerState.maxHp, playerState.hp + amount);
    return playerState.hp;
}

