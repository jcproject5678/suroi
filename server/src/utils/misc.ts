import { Loots, type LootDefinition } from "../../../common/src/definitions/loots";
import { type ReferenceTo } from "../../../common/src/utils/objectDefinitions";
import { weightedRandom } from "../../../common/src/utils/random";
import { LootTiers, type WeightedItem } from "../data/lootTables";

export class LootItem {
    readonly idString: ReferenceTo<LootDefinition>;
    readonly count: number;

    constructor(idString: ReferenceTo<LootDefinition>, count: number) {
        this.idString = idString;
        this.count = count;
    }
}

export function getLootTableLoot(loots: WeightedItem[]): LootItem[] {
    let loot: LootItem[] = [];

    const items: Array<WeightedItem[] | WeightedItem> = [];
    const weights: number[] = [];
    for (const item of loots) {
        items.push(
            item.spawnSeparately && (item.count ?? 1) > 1
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ? new Array<WeightedItem>(item.count!).fill(item)
                : item
        );
        weights.push(item.weight);
    }

    const selectedItem = weightedRandom<WeightedItem | WeightedItem[]>(items, weights);

    for (const selection of [selectedItem].flat()) {
        if ("tier" in selection) {
            loot = loot.concat(getLootTableLoot(LootTiers[selection.tier]));
        } else {
            const item = selection.item;
            loot.push(new LootItem(item, selection.spawnSeparately ? 1 : (selection.count ?? 1)));

            const definition = Loots.getByIDString(item);
            if (definition === undefined) {
                throw new Error(`Unknown loot item: ${item}`);
            }

            if ("ammoSpawnAmount" in definition && "ammoType" in definition) {
                loot.push(new LootItem(definition.ammoType, definition.ammoSpawnAmount));
            }
        }
    }

    return loot;
}

/**
 * Find and remove an element from an array.
 * @param array The array to iterate over.
 * @param value The value to check for.
 */
export function removeFrom<T>(array: T[], value: T): void {
    const index = array.indexOf(value);
    if (index !== -1) array.splice(index, 1);
}
