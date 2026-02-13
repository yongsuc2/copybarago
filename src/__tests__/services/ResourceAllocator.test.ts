import { describe, it, expect } from 'vitest';
import { ResourceAllocator } from '../../services/ResourceAllocator';
import { Player } from '../../domain/entities/Player';
import { ResourceType } from '../../domain/enums';

describe('ResourceAllocator', () => {
  const allocator = new ResourceAllocator();

  it('allocates majority to ATK', () => {
    const player = new Player();
    player.resources.setAmount(ResourceType.GOLD, 10000);

    const plan = allocator.allocateGold(player);
    expect(plan.atkAmount).toBeGreaterThan(plan.hpAmount);
    expect(plan.hpAmount).toBeGreaterThan(plan.defAmount);
  });

  it('total allocation does not exceed available gold', () => {
    const player = new Player();
    player.resources.setAmount(ResourceType.GOLD, 10000);

    const plan = allocator.allocateGold(player);
    const total = plan.atkAmount + plan.hpAmount + plan.defAmount + plan.heritageAmount;
    expect(total).toBeLessThanOrEqual(10000);
  });

  it('auto upgrades talent with gold', () => {
    const player = new Player();
    player.resources.setAmount(ResourceType.GOLD, 50000);

    const results = allocator.autoUpgradeTalent(player);
    expect(results.length).toBeGreaterThan(0);
    expect(player.talent.atkLevel).toBeGreaterThan(0);
    expect(player.resources.gold).toBeLessThan(50000);
  });

  it('advises against spending gems on stamina', () => {
    const player = new Player();
    player.resources.setAmount(ResourceType.GEMS, 10000);

    expect(allocator.shouldSpendGems(player, 'stamina')).toBe(false);
  });

  it('advises gacha when enough gems for 10-pull', () => {
    const player = new Player();
    player.resources.setAmount(ResourceType.GEMS, 3000);

    expect(allocator.shouldSpendGems(player, 'gacha')).toBe(true);
  });
});
