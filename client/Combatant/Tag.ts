import { Combatant } from "./Combatant";
import { SavedTag } from "../Encounter/SavedEncounter";

export const StartOfTurn: DurationTiming = "StartOfTurn";
export const EndOfTurn: DurationTiming = "EndOfTurn";
export type DurationTiming = "StartOfTurn" | "EndOfTurn";

export interface Tag {
    Text: string;
    HasDuration: boolean;
    DurationRemaining: KnockoutObservable<number>;
    DurationTiming: DurationTiming;
    DurationCombatantId: string;
    Remove: () => void;
    Decrement: () => void;
    Increment: () => void;
}

export class Tag implements Tag {
    constructor(public Text: string, combatant: Combatant, duration = -1, public DurationTiming = StartOfTurn, public DurationCombatantId = "") {
        this.HasDuration = (duration > -1);
        this.DurationRemaining = ko.observable(duration);
        this.Remove = () => combatant.Tags.remove(this);
    }

    public Decrement = () => {
        const d = this.DurationRemaining();
        if (d > 0) {
            this.DurationRemaining(d - 1);
        }
    }

    public Increment = () => this.DurationRemaining(this.DurationRemaining() + 1);

    public static getLegacyTags = (tags: (any)[], combatant: Combatant): Tag[] => {
        return tags.map(tag => {
            if (tag.Text) {
                const savedTag: SavedTag = tag;
                return new Tag(savedTag.Text, combatant, savedTag.DurationRemaining, savedTag.DurationTiming, savedTag.DurationCombatantId);
            }
            return new Tag(tag, combatant);
        });
    }
}
