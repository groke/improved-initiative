import { StaticCombatantViewModel } from "./Combatant/StaticCombatantViewModel";
import { env } from "./Environment";
import { TurnTimer } from "./Widgets/TurnTimer";
import { CombatantSuggestor } from "./Player/CombatantSuggestor";
import { SavedEncounter } from "./Encounter/SavedEncounter";
import {Tag} from "./Combatant/Tag";

export class PlayerViewModel {
    private userStylesheet: HTMLStyleElement;
    private combatants: KnockoutObservableArray<StaticCombatantViewModel> = ko.observableArray<StaticCombatantViewModel>([]);
    private activeCombatant: KnockoutObservable<StaticCombatantViewModel> = ko.observable<StaticCombatantViewModel>();
    private encounterId = env.EncounterId;
    private roundCounter = ko.observable();
    private imageCount: KnockoutObservable<number> = ko.observable(0);
    private turnTimer = new TurnTimer();
    private turnTimerVisible = ko.observable(false);
    private allowSuggestions = ko.observable(false);
    private imageModalVisible = ko.observable(false);
    private imageModalURL = ko.observable<String>();
    private imageModalName = ko.observable<String>();
    private imageModalHPDisplay = ko.observable<String>();
    private imageModalTags = ko.observableArray<Tag>();
    private imageModalTimer;
    private imageModalIsViewing = ko.observable(false);

    private socket: SocketIOClient.Socket = io();

    private combatantSuggestor = new CombatantSuggestor(this.socket, this.encounterId);

    constructor() {
        this.socket.on("update encounter", (encounter) => {
            this.LoadEncounter(encounter);
        });

        this.socket.emit("join encounter", this.encounterId);

        this.InitializeStylesheet();
    }

    public LoadEncounterFromServer = (encounterId: string) => {
        $.ajax(`../playerviews/${encounterId}`).done(this.LoadEncounter);
    }

    private InitializeStylesheet() {
        const style = document.createElement("style");
        style.type = "text/css";
        this.userStylesheet = document.getElementsByTagName("head")[0].appendChild(style);
    }

    private LoadEncounter = (encounter: SavedEncounter<StaticCombatantViewModel>) => {
        this.combatants(encounter.Combatants);
        this.imageCount((this.combatants().filter(c => c.ImageURL).length));
        this.turnTimerVisible(encounter.DisplayTurnTimer);
        this.roundCounter(encounter.RoundCounter);
        this.allowSuggestions(encounter.AllowPlayerSuggestions);

        if (encounter.ActiveCombatantId != (this.activeCombatant() || { Id: -1 }).Id) {
            this.turnTimer.Reset();
        }
        if (encounter.ActiveCombatantId) {
            var active = this.combatants().filter(c => c.Id == encounter.ActiveCombatantId).pop();
            this.activeCombatant(active);
            setTimeout(this.ScrollToActiveCombatant, 1);
            if (active.ImageURL && ! this.imageModalIsViewing()) {
              this.ShowImageModal(encounter.ActiveCombatantId, false);
              this.imageModalTimer = setTimeout(this.CloseImageModal, 5000);
            }
        }
    }

    private ScrollToActiveCombatant = () => {
        let activeCombatantElement = $(".active")[0];
        if (activeCombatantElement) {
            activeCombatantElement.scrollIntoView(false);
        }
    }

    private ShowSuggestion = (combatant: StaticCombatantViewModel) => {
        if (!this.allowSuggestions()) {
            return;
        }
        this.combatantSuggestor.Show(combatant);
    }

    private ShowImageModal = (SelectedId:string, didClick:boolean) => {
        if (didClick) this.imageModalIsViewing(true);
        var combatant = this.combatants().filter(c => c.Id == SelectedId).pop();
        this.imageModalName(didClick?combatant.Name:'Start of Turn: '+combatant.Name);
        this.imageModalHPDisplay(combatant.HPDisplay);
        this.imageModalURL(combatant.ImageURL);
        this.imageModalTags(combatant.Tags);
        this.imageModalVisible(true);
    }

    private CloseImageModal = () => {
        this.imageModalVisible(false);
        this.imageModalIsViewing(false);
        clearTimeout(this.imageModalTimer);
    }
}
