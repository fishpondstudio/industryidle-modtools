import { Component } from "preact";
import { AntiCheatPage } from "./AntiCheatPage";
import { ChatPage } from "./ChatPage";
import { ConfigPage } from "./ConfigPage";
import { LeaderboardPage } from "./LeaderboardPage";
import { TradePage } from "./TradePage";

type Page = typeof ChatPage | typeof ConfigPage | typeof TradePage | typeof LeaderboardPage | typeof AntiCheatPage;

export const Routes: Record<string, Page> = {
    "#chat": ChatPage,
    "#config": ConfigPage,
    "#trade": TradePage,
    "#leaderboard": LeaderboardPage,
    "#anticheat": AntiCheatPage,
} as const;

export function getRoutePage() {
    return Routes[window.location.hash] ?? ChatPage;
}

export class App extends Component<{}, { page: Page }> {
    constructor() {
        super();
        window.onhashchange = () => {
            this.setState({ page: getRoutePage() });
        };
        this.state = { page: getRoutePage() };
    }

    render() {
        return (
            <>
                <div class="navigation">
                    <a class={this.state.page === ChatPage ? "active" : ""} href="#chat">
                        Chat
                    </a>

                    <a class={this.state.page === TradePage ? "active" : ""} href="#trade">
                        Trade
                    </a>
                    <a class={this.state.page === ConfigPage ? "active" : ""} href="#config">
                        Config
                    </a>
                    <a class={this.state.page === LeaderboardPage ? "active" : ""} href="#leaderboard">
                        Leaderboard
                    </a>
                    <a class={this.state.page === AntiCheatPage ? "active" : ""} href="#anticheat">
                        Anti-Cheat
                    </a>
                </div>
                <this.state.page />
            </>
        );
    }
}
