import { allMoves } from "#app/data/moves/move";
import { StatusEffect } from "#app/enums/status-effect";
import { CommandPhase } from "#app/phases/command-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Sparkly Swirl", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .enemySpecies(Species.SHUCKLE)
      .enemyLevel(100)
      .enemyMoveset(Moves.SPLASH)
      .enemyAbility(Abilities.BALL_FETCH)
      .moveset([Moves.SPARKLY_SWIRL, Moves.SPLASH])
      .ability(Abilities.BALL_FETCH);

    vi.spyOn(allMoves[Moves.SPARKLY_SWIRL], "accuracy", "get").mockReturnValue(100);
  });

  it("should cure status effect of the user, its ally, and all party pokemon", async () => {
    game.override.battleStyle("double").statusEffect(StatusEffect.BURN);
    await game.classicMode.startBattle([Species.RATTATA, Species.RATTATA, Species.RATTATA]);
    const [leftPlayer, rightPlayer, partyPokemon] = game.scene.getPlayerParty();
    const leftOpp = game.scene.getEnemyPokemon()!;

    vi.spyOn(leftPlayer, "resetStatus");
    vi.spyOn(rightPlayer, "resetStatus");
    vi.spyOn(partyPokemon, "resetStatus");

    game.move.select(Moves.SPARKLY_SWIRL, 0, leftOpp.getBattlerIndex());
    await game.phaseInterceptor.to(CommandPhase);
    game.move.select(Moves.SPLASH, 1);
    await game.toNextTurn();

    expect(leftPlayer.resetStatus).toHaveBeenCalledOnce();
    expect(rightPlayer.resetStatus).toHaveBeenCalledOnce();
    expect(partyPokemon.resetStatus).toHaveBeenCalledOnce();

    expect(leftPlayer.status?.effect).toBeUndefined();
    expect(rightPlayer.status?.effect).toBeUndefined();
    expect(partyPokemon.status?.effect).toBeUndefined();
  });

  it("should not cure status effect of the target/target's allies", async () => {
    game.override.battleStyle("double").enemyStatusEffect(StatusEffect.BURN);
    await game.classicMode.startBattle([Species.RATTATA, Species.RATTATA]);
    const [leftOpp, rightOpp] = game.scene.getEnemyField();

    vi.spyOn(leftOpp, "resetStatus");
    vi.spyOn(rightOpp, "resetStatus");

    game.move.select(Moves.SPARKLY_SWIRL, 0, leftOpp.getBattlerIndex());
    await game.phaseInterceptor.to(CommandPhase);
    game.move.select(Moves.SPLASH, 1);
    await game.toNextTurn();

    expect(leftOpp.resetStatus).toHaveBeenCalledTimes(0);
    expect(rightOpp.resetStatus).toHaveBeenCalledTimes(0);

    expect(leftOpp.status?.effect).toBeTruthy();
    expect(rightOpp.status?.effect).toBeTruthy();

    expect(leftOpp.status?.effect).toBe(StatusEffect.BURN);
    expect(rightOpp.status?.effect).toBe(StatusEffect.BURN);
  });
});
