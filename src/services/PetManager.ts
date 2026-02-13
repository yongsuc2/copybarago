import { Pet } from '../domain/entities/Pet';
import { Player } from '../domain/entities/Player';
import { Stats } from '../domain/value-objects/Stats';
import { Result } from '../domain/value-objects/Result';
import { PetGrade, PetTier } from '../domain/enums';
import { SeededRandom } from '../infrastructure/SeededRandom';
import { PetTable } from '../domain/data/PetTable';

export class PetManager {
  getTotalPassiveBonus(pets: Pet[]): Stats {
    let total = Stats.ZERO;
    for (const pet of pets) {
      const bonus = Stats.create({
        atk: Math.floor(pet.getGlobalBonus().atk * 0.1),
        maxHp: Math.floor(pet.getGlobalBonus().maxHp * 0.1),
      });
      total = total.add(bonus);
    }
    return total;
  }

  hatchEgg(rng: SeededRandom): Pet {
    const template = PetTable.getRandomTemplate(rng);
    return new Pet(
      `pet_${Date.now()}_${rng.nextInt(0, 9999)}`,
      template.name,
      template.tier,
      PetGrade.COMMON,
      1,
      template.basePassiveBonus,
    );
  }

  feedPet(pet: Pet, foodAmount: number): Result<{ levelsGained: number }> {
    return pet.feed(foodAmount);
  }

  tryUpgradeGrade(pet: Pet, duplicates: Pet[]): Result<{ newGrade: PetGrade }> {
    const samePets = duplicates.filter(d => d.name === pet.name && d !== pet);
    if (samePets.length === 0) {
      return Result.fail('No duplicate pets available');
    }
    return pet.upgradeGrade();
  }

  selectBestPet(player: Player): Pet | null {
    if (player.ownedPets.length === 0) return null;

    const sorted = [...player.ownedPets].sort((a, b) => {
      const tierOrder = { [PetTier.S]: 3, [PetTier.A]: 2, [PetTier.B]: 1 };
      if (tierOrder[a.tier] !== tierOrder[b.tier]) {
        return tierOrder[b.tier] - tierOrder[a.tier];
      }
      if (a.getGradeIndex() !== b.getGradeIndex()) {
        return b.getGradeIndex() - a.getGradeIndex();
      }
      return b.level - a.level;
    });

    return sorted[0];
  }

  autoFeedAll(player: Player, totalFood: number): void {
    if (player.ownedPets.length === 0 || totalFood <= 0) return;

    const sorted = [...player.ownedPets].sort((a, b) => {
      if (a === player.activePet) return -1;
      if (b === player.activePet) return 1;
      return b.getGradeIndex() - a.getGradeIndex();
    });

    let remaining = totalFood;
    const activeShare = Math.floor(totalFood * 0.6);

    if (sorted.length > 0 && sorted[0] === player.activePet) {
      const feed = Math.min(activeShare, remaining);
      sorted[0].feed(feed);
      remaining -= feed;
      sorted.shift();
    }

    if (sorted.length > 0 && remaining > 0) {
      const perPet = Math.floor(remaining / sorted.length);
      for (const pet of sorted) {
        if (perPet > 0) pet.feed(perPet);
      }
    }
  }
}
